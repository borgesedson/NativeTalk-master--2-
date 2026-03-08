import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { transcribeAudioMessage } from "../controllers/transcription.controller.js";

const router = express.Router();

// Rota para transcrever áudio e traduzir
router.post("/transcribe", protectRoute, transcribeAudioMessage);

export default router;
