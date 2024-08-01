import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlayList,
  deleteVideoFromPlaylist,
  getPlaylistById,
  getUserAllPlaylists,
  updatePlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();

router.route("/create").post(verifyJWT, createPlaylist);
router.route("/add-video/").patch(verifyJWT, addVideoToPlaylist);
router.route("/update/:playlistId").patch(verifyJWT, updatePlaylist);
router.route("/get/:playlistId").get(verifyJWT, getPlaylistById);
router.route("/get-all").get(verifyJWT, getUserAllPlaylists);
router.route("/remove-video").delete(verifyJWT, deleteVideoFromPlaylist);
router.route("/remove/:playlistId").delete(verifyJWT, deletePlayList);

export default router;
