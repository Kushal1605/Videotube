import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import Video from "../models/video.model.js";
import Subscription from "../models/subscription.model.js";

const addSubscription = asyncHandler(async (req, res) => {
  const videoId = req.params.videoId;
  if (!videoId) {
    throw new ApiError(400, "Invalid video id");
  }

  const channelUser = await Video.findById(videoId);
  const subscriber = req.user;

  if (!channelUser || !subscriber) {
    throw new ApiError(500, "Something went wrong while findding user");
  }

  const subscription = await Subscription.create({
    channel: channelUser._id,
    subscriber: subscriber._id,
  });

  res
    .status(200)
    .json(
      new ApiResponse(201, subscription, "Subscription added successfully")
    );
});

const removeSubscription = asyncHandler(async (req, res) => {
    const videoId = req.params.videoId;
    if (!videoId) {
        throw new ApiError(400, "Invalid video id.");
    }

    const subscriber = req.user;
    const channelUser = await Video.findById(videoId);

    if (!subscriber || !channelUser) {
        throw new ApiError(500, "Unable to fetch user or channel details");
    }

    await subscriber.deleteOne({
        subscriber: subscriber._id,
        channel: channelUser._id,
    });

    res.status(201).json(new ApiResponse(200, {}, "Subscription removed successfully."));
})


export {
    addSubscription,
    removeSubscription,
}
