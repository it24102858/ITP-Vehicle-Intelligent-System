import Package from "../models/normalpackage.js";

// GET promotions
export const getPromotions = async (req, res) => {
  const promotions = await Package.find({ type: "promotion" });
  res.json(promotions);
};

// CREATE package (for provider later)
export const createPackage = async (req, res) => {
  const newPackage = new Package(req.body);
  await newPackage.save();
  res.json(newPackage);
};