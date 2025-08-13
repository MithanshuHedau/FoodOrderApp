const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const Restaurant = require("../../models/restaurent");
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

//add the restaurents
router.post(
  "/restaurants",
  jwtAuthMiddleWare,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Access denied, Admin access is required" });
      }

      const { name, description, address, phone, openingHours } = req.body;
      if (!name || !description || !address || !phone || !openingHours) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const fileObj =
        (req.files && (req.files.image?.[0] || req.files.photo?.[0])) || null;
      if (!fileObj) {
        return res.status(400).json({
          message: "Image file required (field name: image or photo)",
        });
      }

      let imageUrl;
      try {
        const uploadResult = await cloudinary.uploader.upload(fileObj.path, {
          folder: "foodorder/restaurants",
          resource_type: "image",
          transformation: [
            { width: 800, height: 400, crop: "fill", gravity: "auto" },
          ],
        });
        imageUrl = uploadResult.secure_url;
        fs.unlink(fileObj.path, () => {});
      } catch (uploadErr) {
        return res
          .status(500)
          .json({ message: "Image upload failed", error: uploadErr.message });
      }

      const restaurant = new Restaurant({
        name,
        description,
        image: imageUrl,
        address,
        phone,
        openingHours,
        categories: [],
      });
      await restaurant.save();
      return res
        .status(201)
        .json({ message: "Restaurant created", restaurant });
    } catch (err) {
      if (err.name === "ValidationError") {
        return res
          .status(400)
          .json({ message: "Validation failed", errors: err.errors });
      }
      return res
        .status(500)
        .json({ message: "Error creating restaurant", error: err.message });
    }
  }
);

// Get all the restaurents
router.get("/restaurents", jwtAuthMiddleWare, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied, Admin access is required" });
    }

    const restaurants = await Restaurant.find();
    return res
      .status(200)
      .json({ message: "Restaurants fetched", restaurants });
  } catch (err) {
    console.error("GET /restaurents error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get Single Restaurent
router.get("/restaurents/:id", jwtAuthMiddleWare, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied, Admin access is required" });
    }

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    return res.status(200).json({ message: "Restaurant fetched", restaurant });
  } catch (err) {
    console.error("GET /restaurents/:id error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

//Edit Restaurants
router.put(
  "/restaurents/:id",
  jwtAuthMiddleWare,
  upload.single("image"),
  async (req, res) => {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied, Admin access is required" });
    }
    try {
      const { name, description, address, phone, openingHours } = req.body;

      const restaurant = await Restaurant.findById(req.params.id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      restaurant.name = name || restaurant.name;
      restaurant.description = description || restaurant.description;
      restaurant.address = address || restaurant.address;
      restaurant.phone = phone || restaurant.phone;
      restaurant.openingHours = openingHours || restaurant.openingHours;

      if (req.file) {
        try {
          const uploadResult = await cloudinary.uploader.upload(req.file.path, {
            folder: "foodorder/restaurants",
            resource_type: "image",
            transformation: [
              { width: 800, height: 400, crop: "fill", gravity: "auto" },
            ],
          });
          restaurant.image = uploadResult.secure_url;
          fs.unlink(req.file.path, () => {});
        } catch (uploadErr) {
          return res
            .status(500)
            .json({ message: "Image upload failed", error: uploadErr.message });
        }
      }

      await restaurant.save();
      return res
        .status(200)
        .json({ message: "Restaurant updated", restaurant });
    } catch (err) {
      console.error("PUT /restaurents/:id error", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// Delete Restaurants
router.delete("/restaurents/:id", jwtAuthMiddleWare, async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied, Admin access is required" });
  }
  try {
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    return res.status(200).json({ message: "Restaurant deleted", restaurant });
  } catch (err) {
    console.error("DELETE /restaurents/:id error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* Categories */
router.post("/categories", jwtAuthMiddleWare, async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied, Admin access is required" });
  }
  const { name, description } = req.body;
  if (!name || !description) {
    return res
      .status(400)
      .json({ message: "Name and description are required" });
  }

  try {
    const category = new Category({ name, description });
    await category.save();
    return res.status(201).json({ message: "Category created", category });
  } catch (err) {
    console.error("POST /categories error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/categories", jwtAuthMiddleWare, async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied, Admin access is required" });
  }

  try {
    const categories = await Category.find();
    return res.status(200).json({ message: "Categories fetched", categories });
  } catch (err) {
    console.error("GET /categories error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/categories/:id", jwtAuthMiddleWare, async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied, Admin access is required" });
  }

  const { name, description } = req.body;
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    category.name = name || category.name;
    category.description = description || category.description;
    await category.save();
    return res.status(200).json({ message: "Category updated", category });
  } catch (err) {
    console.error("PUT /categories/:id error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/categories/:id", jwtAuthMiddleWare, async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied, Admin access is required" });
  }

  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.status(200).json({ message: "Category deleted", category });
  } catch (err) {
    console.error("DELETE /categories/:id error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/*Menu Management */
router.post(
  "/restaurents/:id/menu",
  jwtAuthMiddleWare,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ]),
  async (req, res) => {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied, Admin access is required" });
    }

    const restaurantId = req.params.id;
    // Trim string inputs (multer leaves them as strings)
    const raw = req.body || {};
    const name = raw.name?.trim();
    const description = raw.description?.trim();
    const priceRaw = raw.price?.toString().trim();
    // Accept either categoryId or category
    const categoryIdRaw = (raw.categoryId || raw.category)?.toString().trim();
    const availableRaw = raw.available;

    const missing = [];
    if (!name) missing.push("name");
    if (!description) missing.push("description");
    if (!priceRaw) missing.push("price");
    if (!categoryIdRaw) missing.push("categoryId");
    if (missing.length) {
      return res.status(400).json({
        message: "Missing required fields",
        missing,
        hint: "Ensure form-data keys exactly: name, description, price, categoryId, image (file).",
      });
    }

    const price = Number(priceRaw);
    if (Number.isNaN(price)) {
      return res.status(400).json({ message: "price must be a valid number" });
    }

    if (!mongoose.Types.ObjectId.isValid(categoryIdRaw)) {
      return res
        .status(400)
        .json({ message: "categoryId must be a valid ObjectId" });
    }
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ message: "Restaurant id invalid" });
    }

    const fileObj =
      (req.files && (req.files.image?.[0] || req.files.photo?.[0])) || null;
    if (!fileObj) {
      return res
        .status(400)
        .json({ message: "Image file required (field name: image or photo)" });
    }

    try {
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      const category = await Category.findById(categoryIdRaw);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      let imageUrl;
      try {
        const uploadResult = await cloudinary.uploader.upload(fileObj.path, {
          folder: "foodorder/menuItems",
          resource_type: "image",
          transformation: [
            { width: 600, height: 400, crop: "fill", gravity: "auto" },
          ],
        });
        imageUrl = uploadResult.secure_url;
        fs.unlink(fileObj.path, () => {});
      } catch (uploadErr) {
        return res
          .status(500)
          .json({ message: "Image upload failed", error: uploadErr.message });
      }

      const menuItem = new MenuItem({
        restaurant: restaurant._id,
        name,
        description,
        price,
        image: imageUrl,
        category: category._id,
        available:
          availableRaw !== undefined
            ? availableRaw === "true" || availableRaw === true
            : true,
      });
      await menuItem.save();
      return res.status(201).json({ message: "Menu item created", menuItem });
    } catch (err) {
      console.error("POST /restaurents/:id/menu error", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// List menu items for a restaurant
router.get("/restaurents/:id/menu", jwtAuthMiddleWare, async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied, Admin access is required" });
  }
  const restaurantId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    return res.status(400).json({ message: "Restaurant id invalid" });
  }
  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant)
      return res.status(404).json({ message: "Restaurant not found" });
    const items = await MenuItem.find({ restaurant: restaurantId }).populate(
      "category",
      "name"
    );
    return res.status(200).json({ message: "Menu items fetched", items });
  } catch (err) {
    console.error("GET /restaurents/:id/menu error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get single menu item for a restaurant
router.get(
  "/restaurents/:id/menu/:menuItemId",
  jwtAuthMiddleWare,
  async (req, res) => {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied, Admin access is required" });
    }
    const { id: restaurantId, menuItemId } = req.params;
    if (
      !mongoose.Types.ObjectId.isValid(restaurantId) ||
      !mongoose.Types.ObjectId.isValid(menuItemId)
    ) {
      return res.status(400).json({ message: "Invalid ids" });
    }
    try {
      const menuItem = await MenuItem.findOne({
        _id: menuItemId,
        restaurant: restaurantId,
      }).populate("category", "name");
      if (!menuItem)
        return res.status(404).json({ message: "Menu item not found" });
      return res.status(200).json({ message: "Menu item fetched", menuItem });
    } catch (err) {
      console.error("GET /restaurents/:id/menu/:menuItemId error", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// Update menu item (optional image replacement)
router.put(
  "/restaurents/:id/menu/:menuItemId",
  jwtAuthMiddleWare,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ]),
  async (req, res) => {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied, Admin access is required" });
    }
    const { id: restaurantId, menuItemId } = req.params;
    if (
      !mongoose.Types.ObjectId.isValid(restaurantId) ||
      !mongoose.Types.ObjectId.isValid(menuItemId)
    ) {
      return res.status(400).json({ message: "Invalid ids" });
    }
    try {
      const menuItem = await MenuItem.findOne({
        _id: menuItemId,
        restaurant: restaurantId,
      });
      if (!menuItem)
        return res.status(404).json({ message: "Menu item not found" });

      const { name, description, price, categoryId, category, available } =
        req.body;
      if (name) menuItem.name = name.trim();
      if (description) menuItem.description = description.trim();
      if (price !== undefined) {
        const p = Number(price);
        if (Number.isNaN(p))
          return res.status(400).json({ message: "price must be a number" });
        menuItem.price = p;
      }
      const categoryInput = categoryId || category;
      if (categoryInput) {
        if (!mongoose.Types.ObjectId.isValid(categoryInput)) {
          return res.status(400).json({ message: "categoryId invalid" });
        }
        const cat = await Category.findById(categoryInput);
        if (!cat)
          return res.status(404).json({ message: "Category not found" });
        menuItem.category = cat._id;
      }
      if (available !== undefined) {
        menuItem.available = available === "true" || available === true;
      }

      const fileObj =
        (req.files && (req.files.image?.[0] || req.files.photo?.[0])) || null;
      if (fileObj) {
        try {
          const uploadResult = await cloudinary.uploader.upload(fileObj.path, {
            folder: "foodorder/menuItems",
            resource_type: "image",
            transformation: [
              { width: 600, height: 400, crop: "fill", gravity: "auto" },
            ],
          });
          menuItem.image = uploadResult.secure_url;
          fs.unlink(fileObj.path, () => {});
        } catch (uploadErr) {
          return res
            .status(500)
            .json({ message: "Image upload failed", error: uploadErr.message });
        }
      }

      await menuItem.save();
      return res.status(200).json({ message: "Menu item updated", menuItem });
    } catch (err) {
      console.error("PUT /restaurents/:id/menu/:menuItemId error", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// Delete menu item
router.delete(
  "/restaurents/:id/menu/:menuItemId",
  jwtAuthMiddleWare,
  async (req, res) => {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied, Admin access is required" });
    }
    const { id: restaurantId, menuItemId } = req.params;
    if (
      !mongoose.Types.ObjectId.isValid(restaurantId) ||
      !mongoose.Types.ObjectId.isValid(menuItemId)
    ) {
      return res.status(400).json({ message: "Invalid ids" });
    }
    try {
      const menuItem = await MenuItem.findOneAndDelete({
        _id: menuItemId,
        restaurant: restaurantId,
      });
      if (!menuItem)
        return res.status(404).json({ message: "Menu item not found" });
      return res.status(200).json({ message: "Menu item deleted", menuItem });
    } catch (err) {
      console.error("DELETE /restaurents/:id/menu/:menuItemId error", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.put("/menu/:id", jwtAuthMiddleWare, async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied, Admin access is required" });
  }
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid menu item id" });
  }
  try {
    const menuItem = await MenuItem.findById(id);
    if (!menuItem)
      return res.status(404).json({ message: "Menu item not found" });

    const { name, description, price, categoryId, category, available } =
      req.body;
    if (name) menuItem.name = name.trim();
    if (description) menuItem.description = description.trim();
    if (price !== undefined) {
      const p = Number(price);
      if (Number.isNaN(p))
        return res.status(400).json({ message: "price must be a number" });
      menuItem.price = p;
    }
    const categoryInput = categoryId || category;
    if (categoryInput) {
      if (!mongoose.Types.ObjectId.isValid(categoryInput)) {
        return res.status(400).json({ message: "categoryId invalid" });
      }
      const cat = await Category.findById(categoryInput);
      if (!cat) return res.status(404).json({ message: "Category not found" });
      menuItem.category = cat._id;
    }
    if (available !== undefined) {
      menuItem.available = available === "true" || available === true;
    }

    const fileObj =
      (req.files && (req.files.image?.[0] || req.files.photo?.[0])) || null;
    if (fileObj) {
      try {
        const uploadResult = await cloudinary.uploader.upload(fileObj.path, {
          folder: "foodorder/menuItems",
          resource_type: "image",
          transformation: [
            { width: 600, height: 400, crop: "fill", gravity: "auto" },
          ],
        });
        menuItem.image = uploadResult.secure_url;
        fs.unlink(fileObj.path, () => {});
      } catch (uploadErr) {
        return res
          .status(500)
          .json({ message: "Image upload failed", error: uploadErr.message });
      }
    }

    await menuItem.save();
    return res.status(200).json({ message: "Menu item updated", menuItem });
  } catch (err) {
    console.error("PUT /restaurents/:id/menu/:menuItemId error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/menu/:id", jwtAuthMiddleWare, async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied, Admin access is required" });
  }
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid menu item id" });
  }
  try {
    const menuItem = await MenuItem.findByIdAndDelete(id);
    if (!menuItem)
      return res.status(404).json({ message: "Menu item not found" });
    return res.status(200).json({ message: "Menu item deleted", menuItem });
  } catch (err) {
    console.error("DELETE /menu/:id error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// see all users
router.get("/users", jwtAuthMiddleWare, async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied, Admin access is required" });
  }
  try {
    const users = await User.find();
    return res.status(200).json({ message: "Users fetched", users });
  } catch (err) {
    console.error("GET /users error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/users/:id", jwtAuthMiddleWare, async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied, Admin access is required" });
  }
  const userId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "User fetched", user });
  } catch (err) {
    console.error("GET /users/:id error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.put(
  "/users/:id",
  jwtAuthMiddleWare,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ]),
  async (req, res) => {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied, Admin access is required" });
    }
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user fields
      const { name, email, role } = req.body;
      if (name) user.name = name.trim();
      if (email) user.email = email.trim();
      if (role) user.role = role.trim();

      // Handle image/photo upload
      const fileObj =
        (req.files && (req.files.image?.[0] || req.files.photo?.[0])) || null;
      if (fileObj) {
        try {
          const uploadResult = await cloudinary.uploader.upload(fileObj.path, {
            folder: "foodorder/users",
            resource_type: "image",
            transformation: [
              { width: 400, height: 400, crop: "fill", gravity: "auto" },
            ],
          });
          // User model uses 'photo' field (previous code mistakenly used image)
          user.photo = uploadResult.secure_url;
          fs.unlink(fileObj.path, () => {});
        } catch (uploadErr) {
          return res
            .status(500)
            .json({ message: "Image upload failed", error: uploadErr.message });
        }
      }

      await user.save();
      const safeUser = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photo: user.photo,
        address: user.address,
        phone: user.phone,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
      return res.status(200).json({ message: "User updated", user: safeUser });
    } catch (err) {
      console.error("PUT /users/:id error", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.delete("/users/:id", jwtAuthMiddleWare, async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied, Admin access is required" });
  }
  const userId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }
  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "User deleted", user });
  } catch (err) {
    console.error("DELETE /users/:id error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ===== Orders Management (Admin) =====
// List orders with optional filters: ?status=placed&userId=...&page=1&limit=20
router.get("/orders", jwtAuthMiddleWare, async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied, Admin access is required" });
  }
  try {
    let { status, userId, page = 1, limit = 20 } = req.query;
    page = Number(page) || 1;
    limit = Math.min(Number(limit) || 20, 100);
    const filter = {};
    if (status) {
      const allowed = [
        "placed",
        "preparing",
        "out for delivery",
        "delivered",
        "cancelled",
      ];
      if (!allowed.includes(status)) {
        return res.status(400).json({ message: "Invalid status filter" });
      }
      filter.orderStatus = status;
    }
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid userId" });
      }
      filter.user = userId;
    }
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "user", select: "name email" })
        .populate({ path: "items.menuItem", select: "name price image" }),
      Order.countDocuments(filter),
    ]);
    return res.status(200).json({
      message: "Orders fetched",
      meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
      orders,
    });
  } catch (err) {
    console.error("GET /admin/orders error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get single order
router.get("/orders/:id", jwtAuthMiddleWare, async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied, Admin access is required" });
  }
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid order id" });
  }
  try {
    const order = await Order.findById(id)
      .populate({ path: "user", select: "name email" })
      .populate({
        path: "items.menuItem",
        select: "name price image description",
      });
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.status(200).json({ message: "Order fetched", order });
  } catch (err) {
    console.error("GET /admin/orders/:id error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Update order status
// Body: { status } allowed transitions forward only; can cancel if not delivered/cancelled
router.put("/orders/:id/status", jwtAuthMiddleWare, async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied, Admin access is required" });
  }
  const { id } = req.params;
  const { status } = req.body || {};
  const allowed = [
    "placed",
    "preparing",
    "out for delivery",
    "delivered",
    "cancelled",
  ];
  if (!status || !allowed.includes(status)) {
    return res
      .status(400)
      .json({ message: "status must be one of " + allowed.join(", ") });
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid order id" });
  }
  try {
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const terminal = ["delivered", "cancelled"];
    if (terminal.includes(order.orderStatus)) {
      return res
        .status(400)
        .json({ message: `Cannot change a ${order.orderStatus} order` });
    }
    if (status === "cancelled") {
      order.orderStatus = "cancelled";
      await order.save();
      return res.status(200).json({ message: "Order cancelled", order });
    }
    // forward-only progression
    const flow = ["placed", "preparing", "out for delivery", "delivered"];
    const currentIndex = flow.indexOf(order.orderStatus);
    const newIndex = flow.indexOf(status);
    if (newIndex === -1) {
      return res.status(400).json({ message: "Invalid flow status" });
    }
    if (newIndex < currentIndex) {
      return res.status(400).json({ message: "Cannot move status backwards" });
    }
    if (newIndex === currentIndex) {
      return res.status(200).json({ message: "Status unchanged", order });
    }
    if (newIndex - currentIndex > 1) {
      return res
        .status(400)
        .json({ message: "Can only advance one step at a time" });
    }
    order.orderStatus = status;
    await order.save();
    return res.status(200).json({ message: "Order status updated", order });
  } catch (err) {
    console.error("PUT /admin/orders/:id/status error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
