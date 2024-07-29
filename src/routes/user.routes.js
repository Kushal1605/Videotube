import { Router } from "express";
import {
  loginUser,
  registerUser,
  logoutUser,
  refreshAccessToken,
  updateAvatar,
  updateCoverImage,
  updatePassword,
  updateProfile,
  getUser,
  getUserChannelDetails,
  getUserWatchHistory,
} from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// secure routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(verifyJWT, refreshAccessToken);
router.route("/update-profile").patch(verifyJWT, updateProfile);
router.route("/update-password").patch(verifyJWT, updatePassword);

router
.route("/update-avatar")
.patch(verifyJWT, upload.single("avatar"), updateAvatar);

router
.route("/update-cover-image")
.patch(verifyJWT, upload.single("coverImage"), updateCoverImage);

router.route("/current-user").get(verifyJWT, getUser);
router.route("/channel/:username").get(verifyJWT, getUserChannelDetails)
router.route("/history").get(verifyJWT, getUserWatchHistory);

export default router;
