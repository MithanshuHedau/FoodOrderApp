const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const Restaurent = require("../../models/restaurent");
const Category = require("../../models/category");
const MenuItem = require("../../models/menuItem");
const Cart = require("../../models/cart");
const Order = require("../../models/order");
const Payment = require("../../models/payment");
const Review = require("../../models/review");
const Offer = require("../../models/offer");
const { jwtAuthMiddleWare, generateToken } = require("../../jwt");

// Import required modules for file upload
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "./uploads";
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const random = uuidv4();
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

// Accept both possible field names 'image' or 'photo'
const upload = multer({ storage: storage });

router.get("/", jwtAuthMiddleWare, async (req, res) => {
  if (req.user.role != "admin") {
    return res
      .status(403)
      .json({ message: "Access denied , Admin access is required" });
  }
});

router.get("/restaurents", jwtAuthMiddleWare, async (req, res) => {
  try {
    const restaurants = await Restaurent.find();
    return res
      .status(200)
      .json({ message: "Restaurants fetched", restaurants });
  } catch (err) {
    console.error("GET /restaurents error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/restaurents/:id", jwtAuthMiddleWare, async (req, res) => {
  try {
    const restaurant = await Restaurent.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    return res.status(200).json({ message: "Restaurant fetched", restaurant });
  } catch (err) {
    console.error("GET /restaurents/:id error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/restaurents/:id/menu", jwtAuthMiddleWare, async (req, res) => {
  try {
    const restaurant = await Restaurent.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    const menuItems = await MenuItem.find({ restaurant: restaurant._id });
    return res.status(200).json({ message: "Menu items fetched", menuItems });
  } catch (err) {
    console.error("GET /restaurents/:id/menu error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/menu/:id", jwtAuthMiddleWare, async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    return res.status(200).json({ message: "Menu item fetched", menuItem });
  } catch (err) {
    console.error("GET /menu/:id error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/categories", jwtAuthMiddleWare, async (req, res) => {
  try {
    const categories = await Category.find();
    return res.status(200).json({ message: "Categories fetched", categories });
  } catch (err) {
    console.error("GET /categories error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Helper to recalc total
async function recalcTotal(cart) {
  await cart.populate({ path: "items.menuItem", select: "price" });
  cart.totalPrice = cart.items.reduce((sum, it) => {
    if (it.menuItem && typeof it.menuItem.price === "number") {
      return sum + it.menuItem.price * it.quantity;
    }
    return sum;
  }, 0);
}

// Add item to cart (creates cart if not exists)
router.post("/cart", jwtAuthMiddleWare, async (req, res) => {
  try {
    const userId = req.user.id;
    let { menuItemId, quantity, items } = req.body;

    // Support both singular and batch payloads
    // Batch example: { items: [{ menuItemId, quantity }, ...] }
    // Single example: { menuItemId, quantity }
    if (!items) {
      if (menuItemId) {
        items = [{ menuItemId, quantity: quantity }];
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message:
          "Provide either menuItemId (and optional quantity) or items array",
        exampleSingle: { menuItemId: "MENU_ITEM_OBJECT_ID", quantity: 2 },
        exampleBatch: {
          items: [
            { menuItemId: "ID1", quantity: 1 },
            { menuItemId: "ID2", quantity: 3 },
          ],
        },
      });
    }

    // Normalize and validate items
    const normalized = [];
    for (const entry of items) {
      if (!entry) continue;
      const mid = (entry.menuItemId || entry.menuItem || "").toString();
      const qtyRaw = entry.quantity;
      const qty = qtyRaw === undefined ? 1 : Number(qtyRaw);
      if (!mid) {
        return res
          .status(400)
          .json({ message: "Each item must include menuItemId" });
      }
      if (!mongoose.Types.ObjectId.isValid(mid)) {
        return res.status(400).json({ message: `Invalid menuItemId: ${mid}` });
      }
      if (isNaN(qty) || qty <= 0) {
        return res
          .status(400)
          .json({ message: "quantity must be a positive number" });
      }
      normalized.push({ menuItemId: mid, quantity: qty });
    }

    // Fetch all menu items to ensure they exist
    const ids = [...new Set(normalized.map((n) => n.menuItemId))];
    const foundItems = await MenuItem.find({ _id: { $in: ids } }).select(
      "_id price"
    );
    if (foundItems.length !== ids.length) {
      const foundSet = new Set(foundItems.map((f) => f._id.toString()));
      const missing = ids.filter((id) => !foundSet.has(id));
      return res
        .status(404)
        .json({ message: "Some menu items not found", missing });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [], totalPrice: 0 });
    }

    // Merge items
    for (const n of normalized) {
      const existing = cart.items.find(
        (i) => i.menuItem.toString() === n.menuItemId
      );
      if (existing) {
        existing.quantity += n.quantity;
      } else {
        cart.items.push({ menuItem: n.menuItemId, quantity: n.quantity });
      }
    }

    await recalcTotal(cart);
    await cart.save();
    await cart.populate({
      path: "items.menuItem",
      select: "name price image description",
    });
    return res.status(200).json({ message: "Cart updated", cart });
  } catch (err) {
    console.error("POST /cart error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get current user's cart
router.get("/cart", jwtAuthMiddleWare, async (req, res) => {
  try {
    const userId = req.user.id;
    let cart = await Cart.findOne({ user: userId }).populate({
      path: "items.menuItem",
      select: "name price image description",
    });
    if (!cart) {
      cart = new Cart({ user: userId, items: [], totalPrice: 0 });
      await cart.save();
    }
    return res.status(200).json({ message: "Cart fetched", cart });
  } catch (err) {
    console.error("GET /cart error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Update quantity of a specific menu item in cart (path param :id is menuItemId)
router.put("/cart/:id", jwtAuthMiddleWare, async (req, res) => {
  try {
    const userId = req.user.id;
    const menuItemId = req.params.id;
    const { quantity } = req.body;
    if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
      return res.status(400).json({ message: "Invalid menu item id" });
    }
    if (quantity === undefined || isNaN(quantity) || Number(quantity) <= 0) {
      return res
        .status(400)
        .json({ message: "quantity must be a positive number" });
    }
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });
    const item = cart.items.find((i) => i.menuItem.toString() === menuItemId);
    if (!item) return res.status(404).json({ message: "Item not in cart" });
    item.quantity = Number(quantity);
    await recalcTotal(cart);
    await cart.save();
    await cart.populate({
      path: "items.menuItem",
      select: "name price image description",
    });
    return res.status(200).json({ message: "Cart item updated", cart });
  } catch (err) {
    console.error("PUT /cart/:id error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Remove single item from cart (path param :id is menuItemId)
router.delete("/cart/:id", jwtAuthMiddleWare, async (req, res) => {
  try {
    const userId = req.user.id;
    const menuItemId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
      return res.status(400).json({ message: "Invalid menu item id" });
    }
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });
    const initialLen = cart.items.length;
    cart.items = cart.items.filter((i) => i.menuItem.toString() !== menuItemId);
    if (cart.items.length === initialLen) {
      return res.status(404).json({ message: "Item not in cart" });
    }
    await recalcTotal(cart);
    await cart.save();
    await cart.populate({
      path: "items.menuItem",
      select: "name price image description",
    });
    return res.status(200).json({ message: "Item removed from cart", cart });
  } catch (err) {
    console.error("DELETE /cart/:id error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Clear cart
router.delete("/cart", jwtAuthMiddleWare, async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();
    return res.status(200).json({ message: "Cart cleared" });
  } catch (err) {
    console.error("DELETE /cart error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Create order from current user's cart
router.post("/orders", jwtAuthMiddleWare, async (req, res) => {
  try {
    const userId = req.user.id;
    const { deliveryAddress } = req.body;

    // Find cart
    const cart = await Cart.findOne({ user: userId }).populate({
      path: "items.menuItem",
      select: "price name",
    });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Determine address
    let finalAddress = (deliveryAddress || "").trim();
    if (!finalAddress) {
      const user = await User.findById(userId).select("address");
      finalAddress = user?.address || "";
    }
    if (!finalAddress) {
      return res.status(400).json({ message: "Delivery address required" });
    }

    // Build items snapshot with price at ordering time
    const orderItems = cart.items.map((ci) => ({
      menuItem: ci.menuItem._id,
      quantity: ci.quantity,
      price: ci.menuItem.price,
    }));

    const totalAmount = orderItems.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );
    if (totalAmount <= 0) {
      return res.status(400).json({ message: "Invalid total amount" });
    }

    const order = new Order({
      user: userId,
      items: orderItems,
      totalAmount,
      deliveryAddress: finalAddress,
      paymentStatus: "pending",
      orderStatus: "placed",
    });
    await order.save();

    // Clear cart after order placement
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    return res.status(201).json({ message: "Order placed", order });
  } catch (err) {
    console.error("POST /orders error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// List current user's orders
router.get("/orders", jwtAuthMiddleWare, async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "items.menuItem",
        select: "name price image description",
      });
    return res.status(200).json({ message: "Orders fetched", orders });
  } catch (err) {
    console.error("GET /orders error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get single order (user only sees own order)
router.get("/orders/:id", jwtAuthMiddleWare, async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order id" });
    }
    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id,
    }).populate({
      path: "items.menuItem",
      select: "name price image description",
    });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    return res.status(200).json({ message: "Order fetched", order });
  } catch (err) {
    console.error("GET /orders/:id error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Cancel order (only if owned by user and status allows)
router.put("/orders/:id/cancel", jwtAuthMiddleWare, async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order id" });
    }
    const order = await Order.findOne({ _id: orderId, user: req.user.id });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (["delivered", "cancelled"].includes(order.orderStatus)) {
      return res.status(400).json({
        message: `Cannot cancel an order that is ${order.orderStatus}`,
      });
    }
    order.orderStatus = "cancelled";
    await order.save();
    return res.status(200).json({ message: "Order cancelled", order });
  } catch (err) {
    console.error("PUT /orders/:id/cancel error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Payment Routes
// Create a payment intent / record (simulation)
// Body: { orderId, paymentMethod } paymentMethod in ['card','upi','cod']
router.post("/payment/create", jwtAuthMiddleWare, async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId, paymentMethod } = req.body || {};
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Valid orderId required" });
    }
    if (!paymentMethod || !["card", "upi", "cod"].includes(paymentMethod)) {
      return res
        .status(400)
        .json({ message: "paymentMethod must be one of card, upi, cod" });
    }
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.user.toString() !== userId) {
      return res.status(403).json({ message: "Not your order" });
    }
    if (order.paymentStatus === "paid") {
      return res.status(400).json({ message: "Order already paid" });
    }

    // Simulate gateway transaction id (pre-auth reference)
    const transactionId =
      "TXN-" +
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2, 8).toUpperCase();

    // For COD we can mark as success immediately; for online keep pending.
    let paymentStatus = paymentMethod === "cod" ? "success" : "pending";
    const paidAt = new Date(); // schema requires paidAt; for pending it's creation time.

    const payment = new Payment({
      order: order._id,
      paymentMethod,
      transactionId,
      paymentStatus,
      paidAt,
    });
    await payment.save();

    // Sync order paymentStatus mapping success->paid
    if (paymentStatus === "success") {
      order.paymentStatus = "paid";
      await order.save();
    }

    return res.status(201).json({
      message: "Payment record created",
      payment,
      orderPaymentStatus: order.paymentStatus,
    });
  } catch (err) {
    console.error("POST /payment/create error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Verify / finalize a payment (simulation). Body: { paymentId, status, transactionId? }
// status in ['success','failed']
router.post("/payment/verify", jwtAuthMiddleWare, async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentId, status, transactionId } = req.body || {};
    if (!paymentId || !mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ message: "Valid paymentId required" });
    }
    if (!["success", "failed"].includes(status)) {
      return res
        .status(400)
        .json({ message: "status must be success or failed" });
    }
    const payment = await Payment.findById(paymentId).populate("order");
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (!payment.order)
      return res.status(404).json({ message: "Related order missing" });
    if (payment.order.user.toString() !== userId) {
      return res.status(403).json({ message: "Not your payment" });
    }
    if (
      payment.paymentStatus === "success" &&
      payment.order.paymentStatus === "paid"
    ) {
      return res
        .status(200)
        .json({ message: "Payment already verified", payment });
    }

    // Update payment fields
    if (transactionId) payment.transactionId = transactionId; // allow update if gateway returned final reference
    payment.paymentStatus = status;
    payment.paidAt = new Date();
    await payment.save();

    // Sync order
    if (status === "success") {
      payment.order.paymentStatus = "paid";
    } else if (status === "failed") {
      // Only set order to failed if it wasn't already paid
      if (payment.order.paymentStatus !== "paid") {
        payment.order.paymentStatus = "failed";
      }
    }
    await payment.order.save();

    return res.status(200).json({
      message: "Payment verification updated",
      payment,
      orderPaymentStatus: payment.order.paymentStatus,
    });
  } catch (err) {
    console.error("POST /payment/verify error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get payment status by payment id
router.get("/payment/status/:id", jwtAuthMiddleWare, async (req, res) => {
  try {
    const pid = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(pid)) {
      return res.status(400).json({ message: "Invalid payment id" });
    }
    const payment = await Payment.findById(pid).populate("order");
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (!payment.order)
      return res.status(404).json({ message: "Related order missing" });
    if (payment.order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not your payment" });
    }
    return res.status(200).json({
      message: "Payment status fetched",
      paymentStatus: payment.paymentStatus,
      orderPaymentStatus: payment.order.paymentStatus,
      payment,
    });
  } catch (err) {
    console.error("GET /payment/status/:id error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Create or update a review for a restaurant by the current user
// Body: { restaurantId, rating (1-5), comment }
router.post("/reviews", jwtAuthMiddleWare, async (req, res) => {
  try {
    const userId = req.user.id;
    const { restaurantId, rating, comment } = req.body || {};

    if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ message: "Valid restaurantId required" });
    }
    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "rating must be a number 1-5" });
    }
    if (!comment || !comment.toString().trim()) {
      return res.status(400).json({ message: "comment required" });
    }

    const restaurant = await Restaurent.findById(restaurantId).select(
      "_id name"
    );
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Enforce single review per user per restaurant (update if exists)
    let review = await Review.findOne({
      user: userId,
      restaurant: restaurantId,
    });
    if (review) {
      review.rating = numericRating;
      review.comment = comment.toString().trim();
      await review.save();
      await review.populate([
        { path: "user", select: "name photo" },
        { path: "restaurant", select: "name" },
      ]);
      return res.status(200).json({ message: "Review updated", review });
    }

    review = new Review({
      user: userId,
      restaurant: restaurantId,
      rating: numericRating,
      comment: comment.toString().trim(),
    });
    await review.save();
    await review.populate([
      { path: "user", select: "name photo" },
      { path: "restaurant", select: "name" },
    ]);
    return res.status(201).json({ message: "Review created", review });
  } catch (err) {
    console.error("POST /reviews error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get a single review by id
router.get("/reviews/:id", jwtAuthMiddleWare, async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid review id" });
    }
    const review = await Review.findById(id)
      .populate({ path: "user", select: "name photo" })
      .populate({ path: "restaurant", select: "name" });
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    // Only the author or admin can see the review? (Assume all authenticated users can view for now)
    return res.status(200).json({ message: "Review fetched", review });
  } catch (err) {
    console.error("GET /reviews/:id error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
