import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const uploadToCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath);

    // console.log("File uploaded successfully ", response);
    return response;
  } catch (err) {
    // upload failed hence remove locally saved temporary files
    console.log("Upload to cloudinary failed ", err);
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const destroyOnCloudinary = async (cloudinaryUrl) => {
  try {
    if (!cloudinaryUrl) return null;

    const response = await cloudinary.uploader.destroy(cloudinaryUrl);
    console.log("Response from cloudinary after deleting file: ", response);
    return response;
  } catch (error) {
    console.log("Failed to delete file on cloudinary ", error);
    return null;
  }
};

export { uploadToCloudinary, destroyOnCloudinary };
