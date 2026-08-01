import { asynchandler } from "../utils/asynchandeler.js"
import {ApiError} from "../utils/apierror.js"
import {User, USER} from "../models/user.models.js"

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
        throw new ApiError("All fields are required",400)
    }

    const existedUSER=User.findOne({
        $or:[{ username },{ email }]
    })
    if (existedUSER) {
        throw new ApiError("user with email or username already exist",409);
        
        
    }
    const avatarLocalPath= req.files?.avatar[0]?.path 
    const coverImage= req.files?.coverImage[0]?.path
    if(!avatarLocalPath){
        throw new ApiError("avatar file is required",400);
        
    }

    User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || " ",
        email,
        password,
        username:username.toLowerCase()
    })
})
  
export { registerUser }