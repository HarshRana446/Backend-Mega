import mongoose from "mongoose";
import { DB_Name } from "../constants.js";

const connectDB = async () => {
  try {
    
    const mongoURI = `${process.env.MONGODB_URI}${DB_Name}`;
    console.log("Connecting to MongoDB URI: ", mongoURI);


    const connectionInstance = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(
      `MongoDB Connected!! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("MongoDB CONNECTION ERROR:", error);
    process.exit(1);
  }
};

export default connectDB;
