import express from "express";
import Request from "../models/Request.js";

const router = express.Router();

//  CREATE
router.post("/", async (req, res) => {
  try {
    const request = await Request.create(req.body);
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET 
router.get("/", async (req, res) => {
  const data = await Request.find();
  res.json(data);
});

//  Get Package Booking Request only 
router.get("/package-bookings", async (req, res) => {
  try {
    const data = await Request.find({ requestType: "package-booking" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE 
router.delete("/:id", async (req, res) => {
  await Request.findByIdAndDelete(req.params.id);
  res.json({ msg: "Deleted" });
});

//  UPDATE 
router.put("/:id", async (req, res) => {
  const updated = await Request.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
});

// SET APPOINTMENT 
router.put("/:id/appointment", async (req, res) => {
  const { date, fee } = req.body;

  if (!date || !fee) {
    return res.status(400).json({ msg: "Date and fee required" });
  }

  if (isNaN(fee)) {
    return res.status(400).json({ msg: "Invalid fee" });
  }

  const selectedDate = new Date(date);
  const now = new Date();

  //validation for date

  if (selectedDate < now) {
    return res.status(400).json({ msg: "Date must be future" });
  }

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

// DEMO PAYMENT 
router.put("/:id/pay", async (req, res) => {
  const updated = await Request.findByIdAndUpdate(
    req.params.id,
    { paymentStatus: "Paid" },
    { new: true }
  );

  res.json(updated);
});

// APPROVE 
router.put("/:id/approve", async (req, res) => {
  const { note } = req.body;

  const request = await Request.findById(req.params.id);

  if (request.paymentStatus !== "Paid") {
    return res.json({ msg: "User must pay first!" });
  }

  request.status = "Approved";
  request.note = note || "Approved successfully";

  await request.save();

  res.json(request);
});


// REJECT

router.put("/:id/reject", async (req, res) => {
  const request = await Request.findByIdAndUpdate(
    req.params.id,
    {
      status: "Rejected"
    },
    { new: true }
  );

  res.json(request);
});


export default router;

