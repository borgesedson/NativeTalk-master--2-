import multer from 'multer';
import path from 'path';
import fs from 'fs';

const groupStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'groups');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `group-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
export const uploadGroupImageMiddleware = multer({ storage: groupStorage }).single('groupImage');

export const createGroup = async (req, res) => res.status(501).json({ message: "Migrated to Insforge" });
export const updateGroupImage = async (req, res) => res.status(501).json({ message: "Migrated to Insforge" });
export async function getUserGroups(req, res) { res.status(200).json([]); }
export async function getGroup(req, res) { res.status(501).json({ message: "Migrated to Insforge" }); }
export async function addMembers(req, res) { res.status(501).json({ message: "Migrated to Insforge" }); }
export async function removeMember(req, res) { res.status(501).json({ message: "Migrated to Insforge" }); }
export async function updateGroup(req, res) { res.status(501).json({ message: "Migrated to Insforge" }); }
export async function deleteGroup(req, res) { res.status(501).json({ message: "Migrated to Insforge" }); }
export async function promoteToAdmin(req, res) { res.status(501).json({ message: "Migrated to Insforge" }); }
export const getAllGroups = async (req, res) => res.status(200).json([]);
export const getGroupById = async (req, res) => res.status(501).json({ message: "Migrated to Insforge" });
export const joinGroup = async (req, res) => res.status(501).json({ message: "Migrated to Insforge" });
export const leaveGroup = async (req, res) => res.status(501).json({ message: "Migrated to Insforge" });
