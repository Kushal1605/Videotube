import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addComment,
  editComment,
  getVideoComments,
  removeComment,
} from "../controllers/comment.controller.js";

const router = Router();

router.route("/add").post(verifyJWT, addComment);
router.route("/update").patch(verifyJWT, editComment);
router.route("/remove").delete(verifyJWT, removeComment);
router.route("/all").get(verifyJWT, getVideoComments);

export default router;
