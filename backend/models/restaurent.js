const mongoose = require("mongoose");

const restaurentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  openingHours: { type: String, required: true },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
});

const Restaurant = mongoose.model("Restaurant", restaurentSchema);
module.exports = Restaurant;
