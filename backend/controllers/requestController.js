import Request from "../models/Request.js";

// CREATE
export const createRequest = async (req, res) => {
  try {
    const count = await Request.countDocuments();

    const newRequest = new Request({
      ...req.body,
      requestId: String(count + 1).padStart(4, "0"),
      requestDate: new Date(),
      status: "Pending"
    });

    await newRequest.save();
    res.json(newRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET
export const getRequests = async (req, res) => {
  try {
    const requests = await Request.find();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE
export const deleteRequest = async (req, res) => {
  try {
    await Request.findByIdAndDelete(req.params.id);
    res.json({ message: "Request Deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE
export const updateRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({
        message: "You can only edit pending requests"
      });
    }

    const updated = await Request.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};