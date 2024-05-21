import { Router } from "express";
import {
  register,
  login,
  logout,
  getProfile,
  resetPassword,
  forgotPassword,
  changePassword,
  updateUser,
  
} from "../controllers/user.controller.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

router.post("/register", upload.single("avatar"), register);
//upload.single("avatar") --> this is a middleware and 'upload.single("avatar") used for single file and we can upload multiple file b
router.post("/login", login);
router.get("/logout", isLoggedIn, logout); /* isLoggedIn is middleware  */
router.get("/me", isLoggedIn, getProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset/:resetToken', resetPassword);
router.post('/change-password', isLoggedIn, changePassword);
router.put('/updateProfile/:id', isLoggedIn, upload.single("avatar"), updateUser);//PUT request to edit the data.

export default router;
