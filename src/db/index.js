import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

async function connectDB() {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log("MONGODB CONNECTION SUCCESSFULL ", connectionInstance.connection.host);
  } catch (err) {
    console.log("MONGODB CONNECTION FAILED! ", err);
    process.exit(1);
  }
}

export default connectDB;
