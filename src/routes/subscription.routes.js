import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addSubscription,
  deleteSubscription,
  getAllChannelSubscribers,
  getAllUserSubscriptions,
} from "../controllers/subscription.controller.js";

const router = Router();
router.route("/add/:channelId").post(verifyJWT, addSubscription);
router.route("/delete/:channelId").delete(verifyJWT, deleteSubscription);
router.route("/all-subscriptions").get(verifyJWT, getAllUserSubscriptions);
router.route("/all-subscribers").get(verifyJWT, getAllChannelSubscribers);

export default router;
