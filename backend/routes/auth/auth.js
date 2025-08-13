const express = require("express");
const User = require("../../models/user");
const router = express.Router();
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();

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

const upload = multer({ storage: storage });

router.get("/", (req, res) => {
  res.send("Auth route is working as Expected ");
});

router.post("/signup", upload.single("photo"), async (req, res) => {
  let { name, email, password, phone, address, role } = req.body;
  if (!name || !email || !password || !address) {
    return res.status(400).json({ message: "Please fill all the fields" });
  }
  if (!req.file) {
    return res
      .status(400)
      .json({ message: "Photo file is required (field name: photo)" });
  }

  // Normalize and validate role (default user)
  const allowedRoles = ["user", "admin"];
  role = (role || "user").toString().trim().toLowerCase();
  if (!allowedRoles.includes(role)) {
    return res
      .status(400)
      .json({ message: `Invalid role. Allowed: ${allowedRoles.join(", ")}` });
  }

  try {
    // If attempting to register as admin, ensure no existing admin
    if (role === "admin") {
      const existingAdmin = await User.findOne({ role: "admin" });
      if (existingAdmin) {
        return res.status(400).json({
          message: "Admin already registered, kindly login as user",
          hint: "Register without role field or role=user to create a normal user account.",
        });
      }
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Upload to Cloudinary
    let photoUrl;
    try {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "foodorder/users",
        resource_type: "image",
        transformation: [
          { width: 400, height: 400, crop: "fill", gravity: "auto" },
        ],
      });
      photoUrl = uploadResult.secure_url;
      fs.unlink(req.file.path, () => {}); // cleanup
    } catch (uploadErr) {
      return res
        .status(500)
        .json({ message: "Photo upload failed", error: uploadErr.message });
    }

    const user = new User({
      name,
      email,
      password,
      phone,
      address,
      role,
      photo: photoUrl,
    });
    await user.save();
    const payload = { id: user._id, email: user.email, role: user.role };
    const token = generateToken(payload);
    const safeUser = {
      _id: user._id,
      name,
      email,
      phone,
      address,
      role: user.role,
      photo: user.photo,
    };
    return res
      .status(201)
      .json({ message: "User registered successfully", user: safeUser, token });
  } catch (err) {
    console.error("/signup error", err);
    if (err.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: err.errors });
    }
    if (err.code === 11000) {
      // duplicate key
      return res
        .status(400)
        .json({ message: "Duplicate field value", keyValue: err.keyValue });
    }
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Password" });
    }
    const payload = { id: user._id, role: user.role };
    const token = generateToken(payload);
    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      photo: user.photo,
    };
    res
      .status(200)
      .json({ message: "Login successful", user: safeUser, token });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

router.get("/user/:id", jwtAuthMiddleWare, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Login first" });
    }

    const { id } = req.params;
    if (req.user.id !== id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "User fetched", user });
  } catch (err) {
    console.error("GET /user/:id error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/user/:id/password", jwtAuthMiddleWare, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Login first" });
    }

    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "oldPassword and newPassword are required" });
    }

    if (oldPassword === newPassword) {
      return res
        .status(400)
        .json({ message: "newPassword must be different from oldPassword" });
    }

    // Only allow self password change or admin
    if (req.user.id !== id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If admin changing someone else's password, skip old password check for that case?
    if (req.user.role !== "admin") {
      const match = await user.comparePassword(oldPassword);
      if (!match) {
        return res.status(400).json({ message: "Old password is incorrect" });
      }
    }

    user.password = newPassword; // pre-save hook will hash
    await user.save();
    return res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("PUT /user/:id/password error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Update user photo
router.put(
  "/user/:id/photo",
  jwtAuthMiddleWare,
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Login first" });
      const { id } = req.params;
      if (req.user.id !== id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      if (!req.file) {
        return res
          .status(400)
          .json({ message: "Photo file is required (field name: photo)" });
      }
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ message: "User not found" });
      let photoUrl;
      try {
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          folder: "foodorder/users",
          resource_type: "image",
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "auto" },
          ],
        });
        photoUrl = uploadResult.secure_url;
        fs.unlink(req.file.path, () => {});
      } catch (uploadErr) {
        return res
          .status(500)
          .json({ message: "Photo upload failed", error: uploadErr.message });
      }
      user.photo = photoUrl;
      await user.save();
      const safeUser = {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        photo: user.photo,
      };
      return res.status(200).json({ message: "Photo updated", user: safeUser });
    } catch (err) {
      console.error("PUT /user/:id/photo error", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
