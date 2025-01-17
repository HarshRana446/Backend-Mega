import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"


const generateAccessAndRefresh = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({validateBeforeSave: false})

    return {accessToken, refreshToken}
    
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token")
  }

}

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
  

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverLocalPath = req.files?.coverimage?.[0]?.path;

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

const loginUser = asyncHandler(async (req, res) => {

  // req body -> data
  // username or email
  // find the user
  // password check 
  // access token && refresh token
  // send cookie

  const { username, password, email } = req.body;
      
  if (!(username || email)) {
    throw new ApiError(400, "Username/Email  is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  })

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Password");
  }

  const {accessToken, refreshToken} =await generateAccessAndRefresh(user._id)

  const LoggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true
  }
  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(200,
      {
        user: LoggedInUser, accessToken, refreshToken
      },
      "User logged in successfully"
    )
  )

})

const logoutUser = asyncHandler(async (req, res) => {

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: "" },
    },
    {
      new: true,
    }
  )
  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options )
  .json(new ApiResponse(200,{},"User Logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(401, "Unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    )
  
    const user = await User.findById(decodedToken._id)
    
    if(!user){
      throw new ApiError(401, "Invalid refresh token")
    }
  
    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401, "Refresh token is used")
    }
  
    const options = {
      httpOnly: true,
      secure: true
    }
  
    const {accessToken,newRefreshToken} =await generateAccessAndRefresh(user._id)
  
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
      new ApiResponse(
        200, 
        {accessToken, refreshToken: newRefreshToken},
        "Access Token refreshed"
      )
    )
  
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token")
  }

})

const changeCurrentPassword = asyncHandler(async(req, res)=> {
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id)
  const isPasswordCorrect =  await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(401, "Invalid password")
  }

  user.password = newPassword;
  await user.save({validateBeforeSave: true})


  return res.status(200).json(
    new ApiResponse(200, {}, "Password changed successfully")
  )
})

const getCurrentUser = asyncHandler(async(req, res)=> {
  return res.status(200).json(
    new ApiResponse(200, req.user, "current user fatched successfully")
  )
})

const updateAccountDetails = asyncHandler(async(req, res)=> {
  const {fullname, email} = req.body

  if(!fullname || !email){
    throw new ApiError(400, "Fullname and email is required")
  }

  const user = await User.findByIdAndUpdate(
  req.user?._id,
  {
    $set: {fullname, email},
  },
  {new: true}).select("-password")

  return res.status(200)
  .json(new ApiResponse(200, user, "User details updated successfully"))
})

const updateUserAvtar = asyncHandler(async(req, res)=>
{
    const avtarLocalPath =  req.file?.path

    if(!avtarLocalPath){
      throw new ApiError(400, "Avatar file is required")
    }

    const avtar = await uploadOnCloudinary(avtarLocalPath)

    if(!avtar.url){
      throw new ApiError(500, "Failed to upload avatar to cloudinary")
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {avatar: avtar.url},
      },
      {new: true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200, user, "User avtarImage updated successfully"))

});

const updateUserCoverImage = asyncHandler(async(req, res)=>
  {
      const coverImageLocalPath =  req.file?.path
  
      if(!coverImageLocalPath){
        throw new ApiError(400, "coverImage file is required")
      }
  
      const coverimage = await uploadOnCloudinary(coverImageLocalPath)
  
      if(!coverimage.url){
        throw new ApiError(500, "Failed to upload coverImage to cloudinary")
      }
  
      const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
          $set: {coverimage: coverimage.url},
        },
        {new: true}
      ).select("-password")

      return res.status(200)
      .json(new ApiResponse(200, user, "User coverImage updated successfully"))
  
  });


export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser,updateAccountDetails, updateUserAvtar, updateUserCoverImage};
