import express from "express";
import Package from "../models/Package.js";
import Request from "../models/Request.js";

const router = express.Router();


//  CREATE NORMAL PACKAGE 
router.post("/package", async (req, res) => {
  try {
    const { name, description, price, duration } = req.body;

    if (!name || !price || !duration) {
      return res.status(400).json({ msg: "Name, duration and price are required" });
    }

    const newPackage = await Package.create({
      name,
      description,
      price,
      duration,
      type: "normal"
    });

    res.json(newPackage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//  CREATE PROMOTION
router.post("/promotion", async (req, res) => {
  try {
    const { name, price, duration, discount, promotionTopic } = req.body;

    if (!name || !price || !duration) {
      return res.status(400).json({ msg: "Required fields missing" });
    }

    const promo = await Package.create({
      name,
      price,
      duration,
      discount,
      promotionTopic,
      type: "promotion"
    });

    res.json(promo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// DELETE PACKAGE
router.delete("/package/:id", async (req, res) => {
  await Package.findByIdAndDelete(req.params.id);
  res.json({ msg: "Deleted" });
});


//  GET ALL REQUESTS
router.get("/requests", async (req, res) => {
  const requests = await Request.find();
  res.json(requests);
});


//  SET APPOINTMENT 
router.put("/requests/:id/appointment", async (req, res) => {
  const { date, fee } = req.body;

  const updated = await Request.findByIdAndUpdate(
    req.params.id,
    {
      appointmentDate: date,
      appointmentFee: fee,
      status: "Waiting Payment"
    },
    { new: true }
  );

  res.json(updated);
});


//APPROVE
router.put("/requests/:id/approve", async (req, res) => {
  const request = await Request.findById(req.params.id);

  if (request.paymentStatus !== "Paid") {
    request.status = "Rejected (No Payment)";
  } else {
    request.status = "Approved";
  }

  await request.save();
  res.json(request);
});


//  REJECT
router.put("/requests/:id/reject", async (req, res) => {
  const updated = await Request.findByIdAndUpdate(
    req.params.id,
    { status: "Rejected" },
    { new: true }
  );

  res.json(updated);
});

export default router;
