import { asynchandler } from "../utils/asynchandeler.js"
import { ApiError } from "../utils/apierror.js"
import JWT from "jsonwebtoken"
import { User } from "../models/user.models.js"

export const verifyJWT =asynchandler( async (req,res,next)=>{
 try {
       const token=req.cookies?.accesstoken || req.header("authorization")?.replace("Bearer ","")
   
   if(!token){
       throw new ApiError(402,"unauthorized request")
   }
   
   const decodedToken = JWT.verify(token,process.env.ACCESS_TOKEN_SECRET)
   
   const user=await User.findById(decodedToken?._id).select("-password -refreshtoken ")
   
   if(!user){
       throw new ApiError(401,"Invalid Access Token");
       
   }
   
   req.user=user;
   next(); 
 } catch (error) {
    throw new ApiError(401,error?.message,"invalid Access token");
    
 }

})
