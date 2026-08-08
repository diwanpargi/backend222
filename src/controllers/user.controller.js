import { asynchandler } from "../utils/asynchandeler.js";
import { ApiError } from "../utils/apierror.js";
import { User } from "../models/user.models.js";
import { uploadoncloudinary } from "../utils/claudinery.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { use } from "react";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
   
    
    const acesstoken = user.generateAccessToken();
 
    
    const refreshtoken = user.generateRefreshToken();
    
     
    user.refreshtoken = refreshtoken;
    await user.save({ validateBeforeSave: false });
    return { acesstoken, refreshtoken };
  } catch (error) {
    console.log("actual error : ",error);
    
    throw new ApiError(
      500,
      "something went wrong while generating refresh token and accesss token",error
    );
  }
};

const registerUser = asynchandler(async (req, res) => {
  //get user details from frontend
  //validation-not empty
  //check if user already exists : username,email
  //check for Image,check for avatar
  //upload them to cloudinary,avatar
  //create user object -create entry in db
  //remove password and refresh token field from response
  // check for user creation
  //return response

  const { fullname, email, username, password } = req.body;
  console.log("email:", email);
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUSER = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUSER) {
    throw new ApiError(409, "user with email or username already exist");
  }

  //console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImagelocalPath= req.files?.coverImage[0]?.path

  let coverImagelocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImagelocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is required");
  }

  const avatar = await uploadoncloudinary(avatarLocalPath);
  const coverImage = await uploadoncloudinary(coverImagelocalPath);
  if (!avatar) {
    throw new ApiError(400, "avatar file is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || " ",
    email,
    password,
    username: username.toLowerCase(),
  });
  const createduser = await User.findById(user._id).select(
    "-password -refreshtoken"
  );
  if (!createduser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createduser, "user registered successfully"));
});

const loginUser = asynchandler(async function (req, res) {
  //reqbody->data
  //username or email
  //find the user
  //password check
  // access and refresh token
  //send cookie

  const { email, username, password } = req.body;
   console.log(email);

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "user with username or email not exist");
  }

  const passwordCheck = await user.isPasswordCorrect(password);

  if (!passwordCheck) {
    throw new ApiError(401, "user password not correct ");
  }

  const { acesstoken, refreshtoken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedinuser = await User.findById(user._id).select(
    "-password -refreshtoken "
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accesstoken", acesstoken, options)
    .cookie("refreshtoken", refreshtoken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedinuser,
          acesstoken,
          refreshtoken,
        },
        "user logged in successfully"
      )
    );
});

const logoutUser = asynchandler(async (req, res) => {
  //find user
  //delete cookie
  //delete refreshtoken
 await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshtoken :undefined
      },
    },
    {
     new:true,
    }
  )

const options = {
    httpOnly: true,
    secure: true,
  };
  return res
  .status(200)
  .clearCookie("accesstoken",options)
  .clearCookie("refreshtoken",options)
  .json(new ApiResponse(200,{},"user logged out")

  )
});

const ResetPassword= asynchandler( async (req,res)=>{
  const {password}=req.body;
  
  req.user.password=password;

  await req.user.save();

  const options = {
    httpOnly: true,
    secure: true,
  };
   return res 
  .status(200)
  .clearCookie("accesstoken",options)
  .clearCookie("refreshtoken",options)
  .json(new ApiResponse(200,{},"Password changed successfully"))

});

const refreshAccessToken=asynchandler( async(req,res)=>{

 const incomingRefreshToken= req.cookies.refreshtoken || req.body.refreshtoken

 if(!incomingRefreshToken){
  throw new ApiError(401,"unauthorized request");
  
 }
 try {
  const decodedtoken= jwt.verify(
   incomingRefreshToken,
   process.env.REFRESH_TOKEN_EXPIRY
  )
 
  const user=await User.findById(decodedtoken?._id)
 
  if(!user){
   throw new ApiError(401,"invalid refresh token")
  }
 
  if (incomingRefreshToken !==user?.refreshtoken) {
    throw new ApiError(401,"refresh token is expired")
  }
 
  const options = {
     httpOnly: true,
     secure: true,
   };
 
  const {acesstoken,newrefreshtoken}= await generateAccessAndRefreshToken(user._id)
 
   return res
   .status(200)
   .cookie("accesstoken",acesstoken,options)
   .cookie("refreshtoken",newrefreshtoken,options)
   .json(
     new ApiResponse(
       200,
       {accesstoken,refreshtoken,newrefreshtoken},
       "Access token refreshed"
     )
   )
 } catch (error) {
  throw new ApiError(401,"invalid refresh token")
 }

});


export { registerUser, loginUser, logoutUser ,ResetPassword,refreshAccessToken};
