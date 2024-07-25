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
router.route("/update-profile").post(verifyJWT, updateProfile);
router.route("/update-password").post(verifyJWT, updatePassword);

router
  .route("/update-avatar")
  .post(verifyJWT, upload.single("avatar"), updateAvatar);

router
  .route("/update-cover-image")
  .post(verifyJWT, upload.single("coverImage"), updateCoverImage);

router.route("/current-user").post(verifyJWT, getUser);

export default router;
