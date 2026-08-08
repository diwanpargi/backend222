import {Router} from "express"
import { loginUser, logoutUser, registerUser,ResetPassword,refreshAccessToken } from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
const router= Router()

router.route("/register").post(
    upload.fields([
    {
        name:"avatar",
        maxCount:1
    },
    {
     name:"coverImage",
     maxCount:1
    }
    ]),
    registerUser)

router.route("/login").post(loginUser)

//secured route

router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
//reset password

router.route("/ReserPassword").post(verifyJWT,ResetPassword)
export default router