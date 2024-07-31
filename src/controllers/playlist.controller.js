import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const playlist = await Playlist.create({
    name,
    description,
    owner: new mongoose.Types.ObjectId(req.user._id),
  });

  if (!playlist) {
    throw new ApiError(500, "Something went wrong while creating playlist.");
  }

  res
    .status(200)
    .json(new APiResponse(200, playlist, "Playlist created successfully."));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.query;

  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError("Invalid playlistId");
  }

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError("Invalid videoId");
  }

  const modifiedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $push: { videos: new mongoose.Types.ObjectId(videoId) } },
    { new: true }
  );

  if (!modifiedPlaylist) {
    throw new ApiError(
      500,
      "Something went wrong while adding video to the playlist"
    );
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        modifiedPlaylist,
        "Video added successfully to the playlist"
      )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);
  if (!playlist) {
    throw new ApiError(
      500,
      "Something went wrong while searching for playlist or playlist does not exist"
    );
  }

  res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const getUserAllPlaylists = asyncHandler(async (req, res) => {
  const user = req.user;

  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(user._id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);

  if (!playlists) {
    throw new ApiError(
      500,
      "Something went wrong while fetching the playlists."
    );
  }

  if (playlists.length == 0) {
    throw new ApiError(400, "No playlists exists for this user");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlists,
        "All playlists have been fetched successfully."
      )
    );
});

const deletePlayList = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const playlist = await Playlist.findByIdAndDelete(playlistId);
  if (!playlist) {
    throw new ApiError(400, "Something went wrong when deleting the playlist.");
  }

  res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist deleted successfully."));
});

const deleteVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId?.trim() || !isValidObjectId(playlistId)) {
    throw new ApiError("Invalid playlist id.");
  }

  if (!videoId?.trim() || !isValidObjectId(videoId)) {
    throw new ApiError("Invalid video id.");
  }

  const modifiedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: videoId } },
    { new: true }
  );

  if (!modifiedPlaylist) {
    throw new ApiError(500, "Something went wrong or video does not exists");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, modifiedPlaylist, "Video deleted successfully.")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId?.trim() || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  const { name, description } = req.body;
  const updatedFeilds = {};

  if (name) {
    updatedFeilds.name = name;
  }

  if (description) {
    updatedFeilds.description = description;
  }

  const modifiedPlaylist = await Playlist.findById(
    playlistId,
    { $set: updatedFeilds },
    { new: true }
  );

  if (!modifiedPlaylist) {
    throw new ApiError(500, "Something went wrong while updating the playlist");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, modifiedPlaylist, "Playlist updated successfully")
    );
});

export {
  createPlaylist,
  addVideoToPlaylist,
  updatePlaylist,
  getPlaylistById,
  getUserAllPlaylists,
  deletePlayList,
  deleteVideoFromPlaylist,
}
