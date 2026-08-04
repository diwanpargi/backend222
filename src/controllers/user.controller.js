import { asynchandler } from "../utils/asynchandeler.js"
import {ApiError} from "../utils/apierror.js"
import { User } from "../models/user.models.js"
import { uploadoncloudinary } from "../utils/claudinery.js"
import { ApiResponse } from "../utils/Apiresponse.js"

const registerUser= asynchandler( async (req,res)=>{
   
    //get user details from frontend
    //validation-not empty
    //check if user already exists : username,email
    //check for Image,check for avatar
    //upload them to cloudinary,avatar
    //create user object -create entry in db
    //remove password and refresh token field from response
    // check for user creation
    //return response
   
    const {fullname,email,username,password }=req.body
    console.log("email:",email);
    if([fullname,email,username,password].some((field)=> field?.trim() === "")){
        throw new ApiError(400, "All fields are required");
    }

    const existedUSER=await User.findOne({
        $or:[{ username },{ email }]
    })
    if (existedUSER) {
        throw new ApiError(409,"user with email or username already exist");
        
        
    }
     
    
    //console.log(req.files);
    
    const avatarLocalPath= req.files?.avatar[0]?.path 
    //const coverImagelocalPath= req.files?.coverImage[0]?.path
 
    let coverImagelocalPath;

    if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length >0){
      coverImagelocalPath=req.files.coverImage[0].path
    }


    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is required");
        }

        const avatar=await uploadoncloudinary(avatarLocalPath)
        const coverImage=await uploadoncloudinary(coverImagelocalPath)
    if (!avatar) {
        throw new ApiError(400,"avatar file is required");
    }

     
  const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || " ",
        email,
        password,
        username:username.toLowerCase()
    })
  const createduser = await User.findById(user._id).select(
    "-password -refreshtoken"
  )
  if(!createduser){
    throw new ApiError(500, "Something went wrong while registering user");
    
  }

  return res.status(201).json(
    new ApiResponse(200,createduser,"user registered successfully")
  )

})
  
export { registerUser }