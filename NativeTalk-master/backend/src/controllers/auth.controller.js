export async function signup(req, res) { res.status(501).json({ message: "Migrated to Insforge" }); }
export async function login(req, res) { res.status(501).json({ message: "Migrated to Insforge" }); }
export function logout(req, res) { res.clearCookie("jwt"); res.status(200).json({ success: true, message: "Logout successful" }); }
export async function onboard(req, res) { res.status(501).json({ message: "Migrated to Insforge" }); }
export async function updateProfile(req, res) { res.status(501).json({ message: "Migrated to Insforge" }); }
