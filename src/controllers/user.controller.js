import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import uploadToCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import upload from "../middlewares/multer.middleware.js";
import User from "../models/user.model.js";

const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "ok",
  });
});

// const registerUser = asyncHandler(async (req, res) => {
//   const { username, password, fullName, email } = req.body;

//   if (
//     [username, password, fullName, email].some((feild) => feild?.trim() === "")
//   ) {
//     throw new ApiError(409, "All feilds are required");
//   }

//   const avatarLocalPath = req.files?.avatar[0];

//   if (!avatarLocalPath) {
//     throw new ApiError(403, "Avatar image is required");
//   }

//   const avatarImageResponse = await uploadToCloudinary(avatarLocalPath);
//   const coverImageLocalPath = req.files?.coverImage[0];

//   let coverImageResponse = "";

//   if (coverImageLocalPath) {
//     coverImageResponse = await uploadToCloudinary(coverImageLocalPath);
//   }

//   const existingUser = await User.findOne({
//     $or: [{ email }, { username }],
//   });

//   if (existingUser) {
//     throw new ApiError(407, "User already exists"); 
//   }

//   const user = await User.create({
//     username, 
//     password,
//     fullName,
//     email,
//     avatar: avatarImageResponse.url,
//     coverImage: coverImageResponse ? coverImageResponse.url : "",
//   })

//   const newUser = await User.findOne({email}).select(
//     "-password -refreshToken"
//   )

//   if (!newUser) {
//     throw new ApiError(500, "Something went wrong while registering the user.")
//   } 

//   res.status(200).json(
//     new ApiResponse(200, newUser, "User created successfully")
//   )
  
// });
export { registerUser };
