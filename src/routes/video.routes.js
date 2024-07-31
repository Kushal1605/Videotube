import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import {
  deleteVideo,
  getAllUserVideos,
  updateVideoDetails,
  updateVideoFileAndDuration,
  updateVideoThumbnail,
  updateVideoViewsAndUserHistory,
  uploadVideo,
  getVideoById,
  toggleIsPublished,
} from "../controllers/video.controller.js";

const router = Router();

router.route("/upload").post(
  verifyJWT,
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  uploadVideo
);

router.route("/delete/:videoId").delete(verifyJWT, deleteVideo);

router
  .route("/u/thumbnail/:videoId")
  .patch(verifyJWT, upload.single("thumbnail"), updateVideoThumbnail);

router
  .route("/u/video/:videoId")
  .patch(verifyJWT, upload.single("videoFile"), updateVideoFileAndDuration);

router.route("/u/details/:videoId").patch(verifyJWT, updateVideoDetails);
router.route("/view/:videoId").post(verifyJWT, updateVideoViewsAndUserHistory);
router.route("/view/all").get(verifyJWT, getAllUserVideos);
router.route("/view/:videoId").get(verifyJWT, getVideoById);
router.route("/toggle-publish").patch(verifyJWT, toggleIsPublished);

export default router;
