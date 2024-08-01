import mongoose, { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { Comment } from "../models/comment.model.js";
import ApiResponse from "../utils/ApiResponse.js";

const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { videoId } = req.params;

  if (!videoId?.trim() || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  if (!content?.trim()) {
    throw new ApiError(400, "Cannot add empty comment to video.");
  }

  const comment = await Comment.create({
    video: new mongoose.Types.ObjectId(videoId),
    owner: new mongoose.Types.ObjectId(req.user._id),
    content,
  });

  if (!comment) {
    throw new ApiError(500, "Failed to add comment.");
  }

  res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment added successfully."));
});

const editComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!commentId?.trim() || !isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id.");
  }

  if (!content?.trim()) {
    throw new ApiError(400, "Cannot add empty comment.");
  }

  const comment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: { content },
    },
    { new: true }
  );

  if (!comment) {
    throw new ApiError(
      404,
      "Comment not found or Something went wrong while updating comment."
    );
  }

  res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const removeComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId?.trim()) {
    throw new ApiError(400, "Invalid comment id.");
  }

  const deletedComment = await Comment.findOneAndDelete(commentId);

  if (!deletedComment) {
    throw new ApiError(
      404,
      "Comment not found or something went wrong while deleting the comment."
    );
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, deletedComment, "Comment deleted successfully.")
    );
});

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId?.trim() || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id.");
  }

  const comments = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
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
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
        video: {
          $first: "$video",
        },
        likeCount: {
            $size: "$likes"
        }
      },
    },
    {
        $project: {
            video: 1,
            owner: 1,
            likeCount: 1,
            content: 1,
        }
    }
  ]);

  if (!comments) {
    throw new ApiError(500, "Something went wrong while fetching the comments.");
  }

    // TODO: Pagination

  res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully."));
});

export { addComment, removeComment, getVideoComments, editComment };
