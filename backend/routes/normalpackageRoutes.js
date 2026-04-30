import express from "express";
import Package from "../models/normalpackage.js";

const router = express.Router();

//  CREATE 
//validation for normal package

router.post("/", async (req, res) => {
  try {
    const { name, description, price, duration, type, discount, tag } = req.body;

    // Basic validation
    if (!name || !duration || price === undefined || price === "") {
      return res.status(400).json({ msg: "Name, duration and price are required" });
    }

   

    const newPackage = await Package.create(req.body);
    res.status(201).json(newPackage);

  } catch (err) {
    console.error("CREATE PACKAGE ERROR:", err.message);
    res.status(500).json({ msg: err.message });
  }
});

// GET ALL 
router.get("/", async (req, res) => {
  try {
    const data = await Package.find();
    res.json(data);
  } catch (err) {
    console.error("GET PACKAGES ERROR:", err.message);
    res.status(500).json({ msg: "Server error: failed to fetch packages" });
  }
});

// DELETE 
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Package.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ msg: "Package not found" });
    }
    res.json({ msg: "Deleted successfully" });
  } catch (err) {
    console.error("DELETE PACKAGE ERROR:", err.message);
    res.status(500).json({ msg: "Server error: failed to delete package" });
  }
});

//  UPDATE
router.put("/:id", async (req, res) => {
  try {
    const existingPackage = await Package.findById(req.params.id);
    if (!existingPackage) {
      return res.status(404).json({ msg: "Package not found" });
    }

    Object.assign(existingPackage, req.body);
    const updated = await existingPackage.save();
    res.json(updated);
  } catch (err) {
    console.error("UPDATE PACKAGE ERROR:", err.message);
    res.status(500).json({ msg: err.message });
  }
});

export default router;
