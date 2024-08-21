import dotenv from "dotenv";
import connectDB from "./Db/index.js";

dotenv.config({
    path: './env'
})


connectDB();
..then(() => {
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`Server is listening on ${process.env.PORT}`);
        
    });
}).catch((err) => {
    console.log("MONGODB connection failed !!", err);
});
























// import express from "express";

// const app = express();

// ( async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URL}/{DB_NAME}`);
//         app.on('error', (err) =>{
//             console.log("Error: ", error);
//             throw err;
//         })

//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening on ${process.env.PORT}`);
//         })

//     } catch (error) {
//         console.error("Error", error);
//         throw err;
        
//     }
// })()