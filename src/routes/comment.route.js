import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addComment,
  editComment,
  getVideoComments,
  removeComment,
} from "../controllers/comment.controller.js";

const router = Router();

router.route("/add/:videoId").post(verifyJWT, addComment);
router.route("/update/:commentId").patch(verifyJWT, editComment);
router.route("/remove/:commentId").delete(verifyJWT, removeComment);
router.route("/all/:videoId").get(verifyJWT, getVideoComments);

export default router;
