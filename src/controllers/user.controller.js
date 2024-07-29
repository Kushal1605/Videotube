import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import uploadToCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({
      validateBeforeSave: false,
    });

    // console.table({refreshToken, accessToken});
    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token."
    );
  }
};
const registerUser = asyncHandler(async (req, res) => {
  const { username, password, fullName, email } = req.body;
  // console.table(req.body)

  if ([fullName, email, username, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [
      {
        username,
      },
      {
        email,
      },
    ],
  });

  if (existingUser) {
    throw new ApiError(409, "User with username or email already exists");
  }

  let avatarLocalPath;
  if (
    req.files &&
    req.files.avatar &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files.avatar[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar Image is required");
  }

  let coverImageLocalPath;
  if (
    req.files &&
    req.files.coverImage &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  const avatar = await uploadToCloudinary(avatarLocalPath);
  const coverImage = await uploadToCloudinary(coverImageLocalPath);
  // console.log(avatar);

  const user = await User.create({
    username,
    password,
    fullName,
    email,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  res
    .status(200)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, password, email } = req.body;
  // console.log(req.body);

  if (!username && !email) {
    throw new ApiError(401, "Username or email is required");
  }

  let user = await User.findOne({
    $or: [
      {
        username,
      },
      {
        email,
      },
    ],
  });

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  if (!password) {
    throw new ApiError(401, "Password is required");
  }

  const isValidUser = await user.isCorrectPassword(password);

  if (!isValidUser) {
    throw new ApiError(400, "Incorrect Credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // console.log(loggedInUser);

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
        },
        "User logged in successfully."
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const user = req.user;
  user.refreshToken = "";

  await user.save({
    validateBeforeSave: false,
  });

  if (!user) {
    throw new ApiError(401, "No user exists");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  let user = await User.findById(decodedToken?._id);

  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (incomingRefreshToken !== user.refreshToken) {
    throw new ApiError(401, "Refresh token expired");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  user = await User.findById(user._id).select("-password -refreshToken");

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user,
        },
        "Access Token refreshed successfully."
      )
    );
});

const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName && !email) {
    throw new ApiError(400, "Nothing to update");
  }

  let updateFields = {};

  if (fullName) {
    updateFields.fullName = fullName;
  }

  if (email) {
    updateFields.email = email;
  }

  let user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(401, "Unauthorized request.");
  }

  user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: updateFields,
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
      },
      "Profile updated successfully"
    )
  );
});

const updatePassword = asyncHandler(async (req, res) => {
  const { password, oldPassword } = req.body;

  if (!password || !oldPassword) {
    throw new ApiError(400, "All feilds are required");
  }

  let user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(400, "Unauthorized request");
  }

  const isCorrectPassword = await user.isCorrectPassword(oldPassword);

  if (!isCorrectPassword) {
    throw new ApiError(401, "Incorrect password");
  }

  user.password = password;
  await user.save();

  res
    .status(200)
    .json(new ApiResponse(200), {}, "Password updated successfully");
});

const updateAvatar = asyncHandler(async (req, res) => {
  let avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadToCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(500, "Upload to Cloudinary failed");
  }

  let user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(401, "Unauthorized request");
  }

  user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  res.status(200).json(new ApiResponse(200, {}, "Avatar updated successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  let coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image is required");
  }

  const coverImage = await uploadToCloudinary(coverImageLocalPath);
  if (!coverImage) {
    throw new ApiError(500, "Failed to upload cover image");
  }

  let user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(401, "Unauthorised request");
  }

  user = await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Cover Image updated successfully"));
});

const getUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorised request");
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        user: req.user,
      },
      "Fetched current user successfully"
    )
  );
});

const getUserChannelDetails = asyncHandler(async (req, res) => {
  const username = req.params.username?.trim().toLowerCase();

  if (!username || username === "") {
    throw new ApiError(401, "User not found");
  }

  const details = await User.aggregate([
    {
      $match: {
        username,
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        subscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: ["$subscribers", [req.user]],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        username: 1,
        fullName: 1,
        avatar: 1,
        coverImage: 1,
        subscriberCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!details?.length) {
    throw new ApiError(
      500,
      "Something went wrong while fetching the channel details"
    );
  }

  res
    .status(200)
    .json(new ApiResponse(200, details[0], "Fetched successfully"));
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(401, "Unauthorized request.");
  }

  const details = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
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
              thumbnail: 1,
              description: 1,
              title: 1,
              duration: 1,
              owner: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        watchHistory: {
          $first: "$watchHistory",
        },
      },
    },
    {
      $project: {
        username: 1,
        fullName: 1,
        watchHistory: 1,
      },
    },
  ]);

  if (!details?.length) {
    throw new ApiError(500, "Something went wrong while fetching user history");
  }

  res
    .status(201)
    .json(new ApiResponse(200, details, "Fetched watch history successfully."));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updateProfile,
  updatePassword,
  updateAvatar,
  updateCoverImage,
  getUser,
  getUserChannelDetails,
  getUserWatchHistory,
};
