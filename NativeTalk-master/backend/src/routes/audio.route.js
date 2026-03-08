import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { uploadAudio } from "../controllers/audio.controller.js";

const router = express.Router();

router.post("/upload", protectRoute, uploadAudio);

export default router;
