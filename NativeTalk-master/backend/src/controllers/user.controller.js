export async function getRecommendedUsers(req, res) { res.status(200).json([]); }
export async function getMyFriends(req, res) { res.status(200).json([]); }
export async function sendFriendRequest(req, res) { res.status(200).json({}); }
export async function acceptFriendRequest(req, res) { res.status(200).json({}); }
export async function getFriendRequests(req, res) { res.status(200).json({ incomingReqs: [], acceptedReqs: [] }); }
export async function getOutgoingFriendReqs(req, res) { res.status(200).json([]); }
