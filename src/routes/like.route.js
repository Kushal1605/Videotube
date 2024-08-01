import { Router } from "express";
import {
  getLikedVideos,
  toggleCommentLike,
  toggleVideoLike,
  toggleTweetLike
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/video/:videoId").post(verifyJWT, toggleVideoLike);
router.route("/comment/:commentId").post(verifyJWT, toggleCommentLike);
router.route("/tweet/:tweetId").post(verifyJWT, toggleTweetLike);
router.route("/view/videos").get(verifyJWT, getLikedVideos);

export default router;
