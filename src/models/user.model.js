import mongoose, { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    fullName: {
      type: String,
      trim: true,
      required: true,
    },

    avatar: {
      type: String,
      default: "",
    },

    coverImage: {
      type: String,
    },

    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],

    videos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],

    refreshToken: {
      type: String,
    },

    password: {
      type: String,
      trim: true,
      required: true,
    },
  },
  { timestamps: true }
);

userSchema.plugin(mongooseAggregatePaginate);
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isCorrectPassword = async function (password) {
  return await bcrypt.compare(this.password, password);
};

userSchema.methods.generateAccessToken = function () {
  jwt.sign(
    {
      _id: this._id,
      username: this.usermame,
      email: this.email,
      fullName: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY_TIME }
  );
};

userSchema.methods.generateRefreshToken = function () {
  jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY_TIME }
  );
};

export default model("User", userSchema);
