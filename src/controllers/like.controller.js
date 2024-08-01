import mongoose, { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { Like } from "../models/like.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId?.trim() || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id.");
  }

  const liked = await Like.findOne({
    video: new mongoose.Types.ObjectId(videoId),
    likedBy: new mongoose.Types.ObjectId(req.user._id),
  });

  if (liked) {
    const deletedLike = await Like.findOneAndDelete({
      video: new mongoose.Types.ObjectId(videoId),
      likedBy: new mongoose.Types.ObjectId(req.user._id),
    });

    if (deletedLike) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            deletedLike,
            "Removed like from the video successfully."
          )
        );
    } else {
      throw new ApiError(
        500,
        "Something went wrong while removing the like from thr video"
      );
    }
  } else {
    const createdLike = await Like.create({
      video: new mongoose.Types.ObjectId(videoId),
      likedBy: new mongoose.Types.ObjectId(req.user._id),
    });
  }

  if (createdLike) {
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          deletedLike,
          "Added like to the video successfully."
        )
      );
  } else {
    throw new ApiError(
      500,
      "Something went wrong while adding like from thr video"
    );
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId?.trim() || !isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment Id.");
  }

  const liked = await Like.findOne({
    comment: new mongoose.Types.ObjectId(commentId),
    likedBy: new mongoose.Types.ObjectId(req.user._id),
  });

  if (liked) {
    const deletedLike = await Like.findOneAndDelete({
      comment: new mongoose.Types.ObjectId(commentId),
      likedBy: new mongoose.Types.ObjectId(req.user._id),
    });

    if (deletedLike) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            deletedLike,
            "Removed like from the comment successfully."
          )
        );
    } else {
      throw new ApiError(
        500,
        "Something went wrong while removing the like from thr comment"
      );
    }
  } else {
    const createdLike = await Like.create({
      comment: new mongoose.Types.ObjectId(commentId),
      likedBy: new mongoose.Types.ObjectId(req.user._id),
    });
  }

  if (createdLike) {
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          deletedLike,
          "Added like to the comment successfully."
        )
      );
  } else {
    throw new ApiError(
      500,
      "Something went wrong while adding like from thr comment"
    );
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId?.trim() || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet Id.");
  }

  const liked = await Like.findOne({
    tweet: new mongoose.Types.ObjectId(tweetId),
    likedBy: new mongoose.Types.ObjectId(req.user._id),
  });

  if (liked) {
    const deletedLike = await Like.findOneAndDelete({
      tweet: new mongoose.Types.ObjectId(tweetId),
      likedBy: new mongoose.Types.ObjectId(req.user._id),
    });

    if (deletedLike) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            deletedLike,
            "Removed like from the tweet successfully."
          )
        );
    } else {
      throw new ApiError(
        500,
        "Something went wrong while removing the like from thr tweet"
      );
    }
  } else {
    const createdLike = await Like.create({
      tweet: new mongoose.Types.ObjectId(tweetId),
      likedBy: new mongoose.Types.ObjectId(req.user._id),
    });
  }

  if (createdLike) {
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          deletedLike,
          "Added like to the tweet successfully."
        )
      );
  } else {
    throw new ApiError(
      500,
      "Something went wrong while adding like from thr tweet"
    );
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
        video: { $ne: null },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "likedBy",
        foreignField: "_id",
        as: "likedBy",
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
        likedBy: {
          $first: "$likedBy",
        },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
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
          {
            $project: {
              title: 1,
              description: 1,
              thumbnail: 1,
              duration: 1,
              views: 1,
              owner: 1,
            },
          },
        ],
      },
    },
  ]);

  if (!likedVideos) {
    throw new ApiError(500, "Something went wrong while fetching the vidoes.");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Fetched liked videos successfully")
    );
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };
