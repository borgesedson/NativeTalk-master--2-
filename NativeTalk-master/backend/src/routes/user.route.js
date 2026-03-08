import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  acceptFriendRequest,
  getFriendRequests,
  getMyFriends,
  getOutgoingFriendReqs,
  getRecommendedUsers,
  sendFriendRequest,
} from "../controllers/user.controller.js";

const router = express.Router();

// apply auth middleware to all routes
router.use(protectRoute);

router.get("/recommended", getRecommendedUsers);
router.get("/friends", getMyFriends);

// Support both /friend-request/:id (REST) and /friend-request (legacy/body)
router.post("/friend-request/:id", sendFriendRequest);
router.post("/friend-request", sendFriendRequest); // Backend controller should handle body if id missing

router.put("/friend-request/:id/accept", acceptFriendRequest);
router.post("/friend-request/:id/accept", acceptFriendRequest); // Support legacy POST

router.get("/friend-requests", getFriendRequests);
router.get("/outgoing-friend-requests", getOutgoingFriendReqs);

export default router;
