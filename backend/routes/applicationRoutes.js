import express from "express";
import {
  createApplication,
  getApplications,
  deleteApplication
} from "../controllers/applicationController.js";

const router = express.Router();

router.post("/", createApplication);
router.get("/", getApplications);
router.delete("/:id", deleteApplication);

export default router;

