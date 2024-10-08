import dotenv from "dotenv";
import connectDB from "./Db/index.js";
import { app } from "./app.js";
dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.on("Error", (error) => {
      console.log("Error :", error);
      throw error;
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`😁  Server is running ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });















  

/*Approach - 1
import express from "express"
const app = express();

(async() => {}) {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        app.on("error", (error) => {
            console.log("ERROR :", error);
            throw error;
        })
        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.log("Error :", error);
        throw error;
    }
}
    */
