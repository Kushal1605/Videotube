import ApiError from "../utils/ApiError.js";
import mongoose, { isValidObjectId } from "mongoose";
import ApiResponse from "../utils/ApiResponse.js";
import Subscription from "../models/subscription.model.js";
import asyncHandler from "../utils/asyncHandler.js";

const addSubscription = asyncHandler(async (req, res) => {
  const subscriberId = req.user._id;
  const channelId = req.params.channelId;

  if (!channelId || !isValidObjectId(channelId)) {
    throw new ApiError("Invalid Channel Id.");
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: new mongoose.Types.ObjectId(subscriberId),
    channel: new mongoose.Types.ObjectId(channelId),
  });

  if (existingSubscription) {
    throw new ApiError(400, "Subscription already exists.");
  }

  const subscription = await Subscription.create({
    subscriber: new mongoose.Types.ObjectId(subscriberId),
    channel: new mongoose.Types.ObjectId(channelId),
  });

  if (!subscription) {
    throw new ApiError(500, "Something went wrong while adding subscription.");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, subscription, "Subscription added successfully.")
    );
});

const deleteSubscription = asyncHandler(async (req, res) => {
  const subscriberId = req.user._id;
  const channelId = req.params.channelId;

  if (!channelId || !isValidObjectId(channelId)) {
    throw new ApiError("Invalid Channel Id.");
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: new mongoose.Types.ObjectId(subscriberId),
    channel: new mongoose.Types.ObjectId(channelId),
  });

  if (!existingSubscription) {
    throw new ApiError(400, "Subscription does not exists.");
  }

  const subscription = await Subscription.findOneAndDelete({
    subscriber: new mongoose.Types.ObjectId(subscriberId),
    channel: new mongoose.Types.ObjectId(channelId),
  });

  if (!subscription) {
    throw new ApiError(
      500,
      "Something went wrong while deleting subscription."
    );
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, subscription, "Subscription deleted successfully.")
    );
});

const getAllUserSubscriptions = asyncHandler(async (req, res) => {
  const user = req.user;

  const subscriptions = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(user._id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelDetails",
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
        channelDetails: {
          $first: "$channelDetails",
        },
      },
    },
    {
      $project: {
        channelDetails: 1,
        subscriber: 1,
      },
    },
  ]);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subscriptions },
        "All subscriptions fetched successfully."
      )
    );
});

const getAllChannelSubscribers = asyncHandler(async (req, res) => {
  const user = req.user;

  const subscriptions = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(user._id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "channelDetails",
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
        channelDetails: {
          $first: "$channelDetails",
        },
      },
    },
    {
      $project: {
        channelDetails: 1,
        channel: 1,
      },
    },
  ]);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subscriptions },
        "All subscribers fetched successfully."
      )
    );
});

export {
  addSubscription,
  deleteSubscription,
  getAllUserSubscriptions,
  getAllChannelSubscribers,
};
