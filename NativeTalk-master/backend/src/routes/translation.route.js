import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { translateMessage, translateMessageMultiple } from "../controllers/translation.controller.js";
import { getCacheStats, clearCache } from "../lib/translation.js";

const router = express.Router();

// Rota para traduzir uma mensagem para um usuário específico
router.post("/translate", protectRoute, translateMessage);

// Rota para traduzir uma mensagem para múltiplos usuários
router.post("/translate-multiple", protectRoute, translateMessageMultiple);

// Rota para obter estatísticas do cache
router.get("/cache-stats", protectRoute, (req, res) => {
  try {
    const stats = getCacheStats();
    res.json({
      success: true,
      stats,
      message: `Cache está economizando ${stats.savings} chamadas de API. Taxa de acerto: ${stats.hitRate}`
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Erro ao obter estatísticas do cache",
      error: error.message 
    });
  }
});

// Rota para limpar o cache (apenas admin/debug)
router.post("/clear-cache", protectRoute, (req, res) => {
  try {
    clearCache();
    res.json({
      success: true,
      message: "Cache limpo com sucesso"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Erro ao limpar cache",
      error: error.message 
    });
  }
});

export default router;
