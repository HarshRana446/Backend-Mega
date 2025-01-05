import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  //validation - not empty
  //check if user already exists - chack using email or username
  //check for images, check for avatar
  //upload them to cloudinary, avatar
  //create user object - create entry in db
  //remove password and refresh tooken field from response
  //check for user creation
  //return res

  const { fullname, email, password, username } = req.body;
  // console.log("email: ", email);

  if (
    [fullname,email,password,username].some((field)=>
      field?.trim() === "")
    ) {
    throw new ApiError(400, "ALL fields is required");
  }


  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  })
  if(existedUser){
    throw new ApiError(409, "User already exists");
  }

  console.log("req.files: ", req.files);
  

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverLocalPath = req.files?.coverimage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverimage = await uploadOnCloudinary(coverLocalPath);

  if (!avatar ||!coverimage) {
    throw new ApiError(500, "Failed to upload images to cloudinary");
  }

const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverimage: coverimage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
})

  const createdUser = await User.findById(user._id)
  .select("-password -refreshToken")

  if (!createdUser) {
    throw new ApiError(500, "Failed to create user");
  }

  return res.status(201).json(
    new ApiResponse(200, "User created successfully", createdUser)
  )

});

export { registerUser };
