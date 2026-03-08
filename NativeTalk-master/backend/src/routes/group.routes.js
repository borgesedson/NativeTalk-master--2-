import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    createGroup,
    getAllGroups,
    joinGroup,
    leaveGroup,
    getGroup, // ✅ USAR ESTA FUNÇÃO COMPLETA
    updateGroupImage,
    uploadGroupImageMiddleware,
    getUserGroups, // ✅ ADICIONAR ESTA FUNÇÃO
} from "../controllers/group.controller.js";

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(protectRoute);

// Rotas existentes
router.get("/", getAllGroups);
router.get("/user", getUserGroups);
router.get("/:id", getGroup); // ✅ USAR getGroup
router.post(
    "/",
    uploadGroupImageMiddleware, // ✅ Adicionar middleware
    createGroup
);
router.post("/:id/join", joinGroup);
router.post("/:id/leave", leaveGroup);

// ✅ Nova rota para atualizar imagem do grupo
router.put(
    "/:id/image",
    uploadGroupImageMiddleware,
    updateGroupImage
);

export default router;
