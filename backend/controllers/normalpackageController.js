import Package from "../models/normalpackage.js";

// GET normal packages
export const getPackages = async (req, res) => {
  const packages = await Package.find({ type: "normal" });
  res.json(packages);
};

// CREATE package (for provider later)
export const createPackage = async (req, res) => {
  const newPackage = new Package(req.body);
  await newPackage.save();
  res.json(newPackage);
};