import Video from "../models/video.model.js";
import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import {
  uploadToCloudinary,
  destroyOnCloudinary,
} from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";

const uploadVideo = asyncHandler(async (req, res) => {
  const { duration, description, title } = req.body;

  if ([duration, description, title].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  let videoFileLocalPath;

  if (
    req.files &&
    req.files.videoFile &&
    Array.isArray(req.files.videoFile) &&
    req.files.videoFile.length > 0
  ) {
    videoFileLocalPath = req.files.videoFile[0].path;
  }

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is required.");
  }

  const videoFile = await uploadToCloudinary(videoFileLocalPath);
  if (!videoFile) {
    throw new ApiError(
      500,
      "Something went wrong while uploading video to cloudinary,"
    );
  }

  let thumbnailLocalPath;

  if (
    req.files &&
    req.files.thumbnail &&
    Array.isArray(req.files.thumbnail) &&
    req.files.thumbnail.length > 0
  ) {
    thumbnailLocalPath = req.files.thumbnail[0].path;
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file is required.");
  }

  const thumbnail = await uploadToCloudinary(thumbnailLocalPath);
  if (!thumbnail) {
    throw new ApiError(
      500,
      "Something went wrong while uploading thumbnail to cloudinary,"
    );
  }

  const video = await Video.create({
    title,
    description,
    duration,
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    owner: req.user._id,
  });

  if (!video) {
    await destroyOnCloudinary(videoFile.url);
    await destroyOnCloudinary(thumbnail.url);
    throw new ApiError(500, "Something went wrong while uploading video.");
  }

  res
    .status(200)
    .json(new ApiResponse(201, video, "Video uploaded successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const videoId = req.params.videoId;

  if (!videoId?.trim() || !isValidObjectId(videoId)) {
    throw new ApiError(401, "Invalid VideoId");
  }
  // TODO: Verify if it is user video
  await Video.findByIdAndDelete(videoId);
  res.status(200).json(new ApiResponse(200, {}, "Video removed successfully."));
});

const updateVideoDetails = asyncHandler(async (req, res) => {
  const videoId = req.params.videoId;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid VideoId");
  }
  
  // TODO: Verify if it is user video
  const { description, title } = req.body;
  let updatedFeilds = {};

  if (description) {
    updatedFeilds.description = description;
  }

  if (title) {
    updatedFeilds.title = title;
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: updatedFeilds,
    },
    {
      new: true,
    }
  );

  res
    .status(200)
    .json(new ApiResponse(200, video, "Updated video details successfully."));
});

const updateVideoThumbnail = asyncHandler(async (req, res) => {
  const videoId = req.params.videoId;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const thumbnailLocalPath = req.file?.path;
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail not found");
  }

  const thumbnail = await uploadToCloudinary(thumbnailLocalPath);

  if (!thumbnail) {
    throw new ApiError(500, "Failed to upload thumbnail to cloudinary.");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    { $set: { thumbnail: thumbnail.url } },
    { new: true }
  );

  res
    .status(201)
    .json(new ApiResponse(200, video, "Thumbnail successfully updated."));
});

const updateVideoFileAndDuration = asyncHandler(async (req, res) => {
  const videoId = req.params.videoId;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id.");
  }

  const { duration } = req.body;

  if (!duration) {
    throw new ApiError(400, "Video duration is required.");
  }

  const videoFileLocalPath = req.file?.path;
  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is required.");
  }

  const videoFile = await uploadToCloudinary(videoFileLocalPath);

  const video = await Video.findByIdAndUpdate(
    videoId,
    { $set: { videoFile: videoFile.url, duration } },
    { new: true }
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        201,
        video,
        "Video file and duration updated successfully."
      )
    );
});

const updateVideoViewsAndUserHistory = asyncHandler(async (req, res) => {
  const videoId = req.params.videoId;

  if (!videoId.trim() || !isValidObjectId(videoId)) {
    throw new ApiError(401, "Invalid Video Id.");
  }

  await User.findByIdAndUpdate(
    req.user._id,
    { $push: { watchHistory: videoId } },
    { new: true }
  );

  await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } }, { new: true });

  res
    .status(200)
    .json(new ApiResponse(201, {}, "Updated views and user watch history."));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId?.trim() || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Id not found");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
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

  if (!video) {
    throw new ApiError(400, "Video not found.");
  }

  res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully."));
});

const getAllUserVideos = asyncHandler(async (req, res) => {
  const { limit = 10, page = 1, userId, sortBy, sortType } = req.query;

  if (!userId) {
    throw new ApiError(400, "No userId provided.");
  }

  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
        isPublished: true,
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
    { $sort: { [sortBy]: parseInt(sortType) } },
    { $limit: parseInt(limit) },
  ]);

  if (!videos?.length) {
    throw new ApiError(402, "No video found.");
  }
  res
    .status(200)
    .json(new ApiResponse(201, videos, "Videos fetched successfully."));
});

const toggleIsPublished = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId?.trim() || !isValidObjectId(videoId)) {
    throw new ApiError(403, "Invalid video id.");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(500, "Video not found.");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, {}, `Published status set to ${video.isPublished}`)
    );
});

export {
  uploadVideo,
  deleteVideo,
  updateVideoDetails,
  updateVideoThumbnail,
  updateVideoFileAndDuration,
  updateVideoViewsAndUserHistory,
  getAllUserVideos,
  getVideoById,
  toggleIsPublished,
};
