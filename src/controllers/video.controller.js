import Video from "../models/video.model.js";
import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import uploadToCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

const uploadVideo = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(401, "Unauthorized request.");
  }

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
    throw new ApiError(400, "Video file is required.");
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
    owner: user._id,
  });

  res
    .status(200)
    .json(new ApiResponse(201, video, "Video uploaded successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(402, "Unauthorized request");
  }

  const videoId = req.params.videoId;
  if (!videoId?.trim()) {
    throw new ApiError(401, "Invalid VideoId");
  }

  await Video.findByIdAndDelete(videoId);
  res.status(200).json(new ApiResponse(200, {}, "Video removed successfully."));
});

const updateVideoDetails = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(400, "Unauthorized request");
  }

  const videoId = req.params.videoId;
  if (!videoId) {
    throw new ApiError(400, "Video not found");
  }
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
  const user = req.user;

  if (!user) {
    throw new ApiError(401, "Unauthorized request");
  }

  const videoId = req.params.videoId;
  if (!videoId) {
    throw new ApiError(400, "Invalid video id");
  }

  const thumbnailLocalPath = req.file?.thumbnail;
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail not found");
  }

  const thumbnail = await uploadToCloudinary(thumbnailLocalPath);
  if (!thumbnail) {
    throw new ApiError(500, "Failed to upload thumbnail to cloudinary.");
  }

  const video = await Video.findByIdAndModify(
    videoId,
    { $set: { thumbnail: thumbnail.url } },
    { new: true }
  );

  res
    .status(201)
    .json(new ApiResponse(200, video, "Thumbnail successfully updated."));
});

const updateVideoFileAndDuration = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(400, "Unauthorized request.");
  }

  const videoId = req.params.videoId;

  if (!videoId) {
    throw new ApiError(400, "Invalid Video Id.");
  }

  const { duration } = req.body;

  if (!duration) {
    throw new ApiError(400, "Video duration is required.");
  }

  const videoFileLocalPath = req.file?.videoFile;
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
    .json(201, video, "Video file and duration updated successfully.");
});

const updateVideoViewsAndUserHistory = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(401, "Unauthorized request.");
  }

  const videoId = req.params.videoId;
  if (!videoId) {
    throw new ApiError(401, "Invalid Video Id.");
  }

  const updatedUuser = await User.findByIdAndUpdate(
    user._id,
    { $push: { watchHistory: videoId } },
    { new: true }
  );

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { views: 1 } },
    { new: true }
  );

  res
  .status(200)
  .json(201, {}, "Updated views and user watch history.");
});

export {
  uploadVideo,
  deleteVideo,
  updateVideoDetails,
  updateVideoThumbnail,
  updateVideoFileAndDuration,
  updateVideoViewsAndUserHistory,
};
