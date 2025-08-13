const express = require("express");
const connectDb = require("./connection/db");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv");
dotenv.config();

// Enable CORS for frontend
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the Food Order API");
});

// Test route to check if server is working
app.get("/test", (req, res) => {
  res.json({
    message: "Backend is working!",
    timestamp: new Date().toISOString(),
  });
});

// Public route for restaurants (for testing)
app.get("/public/restaurants", async (req, res) => {
  try {
    const Restaurent = require("./models/restaurent");
    const restaurants = await Restaurent.find();
    res.json({ message: "Restaurants fetched", restaurants });
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res
      .status(500)
      .json({ message: "Error fetching restaurants", error: error.message });
  }
});

// Public single restaurant and menu
app.get("/public/restaurants/:id", async (req, res) => {
  try {
    const Restaurent = require("./models/restaurent");
    const MenuItem = require("./models/menuItem");
    const id = req.params.id;
    const restaurant = await Restaurent.findById(id);
    if (!restaurant)
      return res.status(404).json({ message: "Restaurant not found" });
    return res.json({ message: "Restaurant fetched", restaurant });
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    res
      .status(500)
      .json({ message: "Error fetching restaurant", error: error.message });
  }
});
app.get("/public/restaurants/:id/menu", async (req, res) => {
  try {
    const Restaurent = require("./models/restaurent");
    const MenuItem = require("./models/menuItem");
    const id = req.params.id;
    const restaurant = await Restaurent.findById(id);
    if (!restaurant)
      return res.status(404).json({ message: "Restaurant not found" });
    const menuItems = await MenuItem.find({ restaurant: restaurant._id });
    return res.json({ message: "Menu items fetched", menuItems });
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res
      .status(500)
      .json({ message: "Error fetching menu items", error: error.message });
  }
});

app.use("/auth", require("./routes/auth/auth"));
app.use("/user", require("./routes/user/userRoutes"));
app.use("/admin", require("./routes/admin/adminRoutes"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  connectDb();
  console.log(`Server is running on port ${PORT}`);
  console.log(`Frontend should connect to: http://localhost:${PORT}`);
});

app.get("/public/restaurants/:id/reviews", async (req, res) => {
  try {
    const Restaurent = require("./models/restaurent");
    const Review = require("./models/review");
    const id = req.params.id;
    const restaurant = await Restaurent.findById(id).select("_id");
    if (!restaurant)
      return res.status(404).json({ message: "Restaurant not found" });
    const reviews = await Review.find({ restaurant: id })
      .sort({ createdAt: -1 })
      .populate({ path: "user", select: "name photo" });
    return res.json({ message: "Reviews fetched", reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res
      .status(500)
      .json({ message: "Error fetching reviews", error: error.message });
  }
});
