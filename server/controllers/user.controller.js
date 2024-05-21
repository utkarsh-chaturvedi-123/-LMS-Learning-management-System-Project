import CustomAppError from "../utils/error.util.js";
import User from "../model/user.model.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import { sendEmail } from "../utils/sendEmails.js";
import crypto from "crypto";

const cookieOptions = {
  maxTime: 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: true,
};

const register = async (req, res, next) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return next(new CustomAppError("All fields are required", 400));
    /* 1) calling  constructor 'CustomAppError()' from 'utils/error.util.js' 
         
       2) we are passing 2 argument(first is 'message' , second is 'statuscode') in constructor bcz we have create 2 parameterize constructor.
        
       3) i have create this constructor bcz we don't want to write common code again for error  like --> res.status(400).json({ success: false, message: "Every field are Required"}) */
  }
  const userExists = await User.findOne({ email });

  if (userExists) {
    return next(new CustomAppError("User already exists", 400));
  }

  const user = await User.create({
    fullName,
    email,
    password,
    avatar: {
      public_id: email,
      secure_url: "https://api.cloudinary.com/v1_1/mycloud/image/upload",
    },
  });
  if (!user) {
    return next(
      new CustomAppError("User registration failed, please try again", 400)
    );
  }

  // TODO: file upload
  
  if (file.path) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        // configuration of file
        folder: "lms",
        width: 250,
        height: 250,
        gravity: "faces",
        crop: "fill",
      });

      if (result) {
        user.avatar.public_id = result.public_id;
        user.avatar.secure_url = result.secure_url;

        //Remove file from server
        fs.rm(`uploads/${req.file.filename}d`);
      }
    } catch (error) {
      return next(
        new CustomAppError(error || "File not uploades, please try again", 400)
      );
    }
  }
  await user.save();

  user.password = undefined;

  const token = await user.generateJWTToken();
  res.cookie("token", token, cookieOptions);
  res.status(201).json({
    success: true,
    message: "User registered successfully",
    user,
  });
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new CustomAppError("All fields are required", 400));
    }
    const user = await User.findOne({
      email,
    }).select(
      "+password"
    ); /* used '+' because we have used 'secure:false' so, by default we will not get password */

    if (!user || !user.comparePassword(password)) {
      return next(new CustomAppError("Email or password does not match", 400));
    }

    const token = await user.generateJWTToken();
    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      success: true,
      message: "User LoggedIn successfully",
      user,
    });
  } catch (error) {
    return next(new CustomAppError(error.message, 500));
  }
};

const logout = async (req, res) => {
  res.cookie("token", null, {
    secure: true,
    maxTime: 0,
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "User LoggedOut successfully",
  });
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    res.status(200).json({
      success: true,
      message: "User details",
      user,
    });
  } catch (error) {
    return next(new CustomAppError("Failed to fetch user profile", 400));
  }
};

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new CustomAppError("Email is Required", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new CustomAppError("Email is not Registered", 400));
  }
  const resetToken = await user.generatePasswordResetToken();

  await user.save();

  const resetPasswordURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const subject = "Reset Password";
  const message = `you can reset your password by clicking <a href=${resetPasswordURL} target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in the new new Tab ${resetPasswordURL}.\n If you have not request this, kindly ignore`;

  try {
    await sendEmail(email, subject, message);

    res.status(200).json({
      success: true,
      message: `Reset password token has beeen sent to ${email} successfully`,
    });
  } catch (error) {
    /* we have create both undefined bcz if error got during sending mail so, these both get already token and its expiry times if user again hit forgot password then this will again take storage in the database  so, previous token is unnecessay that why we have define 'undefine' in both of these so, we can retry from client side*/
    user.forgotPasswordExpiry = undefined;
    user.forgotPasswordToken = undefined;
    return next(new CustomAppError(error.message, 400));
  }
};

const resetPassword = async (req, res) => {
  //we use req.params to access dynamic values from the URL path. This is useful when we have route patterns with placeholders, such as /users/:id or /products/:productId.
  const { resetToken } = req.params;
  const { password } = req.body;
  const forgotPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await User.findOne({
    forgotPasswordToken,
    forgotPasswordExpiry: { $gt: Date.now() }, //$gt means greater
  });

  if (!user) {
    return next(
      new CustomAppError("Token is invailed or expired , please try again", 400)
    );
  }
  user.password = password;
  user.forgotPasswordToken = undefined; // we are updating or assign with 'undefined' this bcz its work is done
  user.forgotPasswordExpiry = undefined;
  user.save();

  res.status(200).json({
    success: true,
    message: "password changed successfully!",
  });
};

const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const { id } = req.user;

  if (!changePassword || !newPassword) {
    return next(new CustomAppError("All fiels are mandotary", 400));
  }
  const user = await User.findById(id).select("+password");

  if (!user) {
    return next(new CustomAppError("user does not exist", 400));
  }
  const isPasswordValid = await user.comparePassword(oldPassword);

  if (!isPasswordValid) {
    return next(new CustomAppError("invailed old password", 400));
  }
  user.password = newPassword;
  await user.save();
  user.password = undefined;

  res.status(200).json({
    success: true,
    message: "password change successfully!",
  });
};
const updateUser = async (req, res) => {
  const { fullName } = req.body;
  const { id } = req.user.id;

  const user = await User.findById(id);

  if (!user) {
    return next(new CustomAppError("User does not exist", 400));
  }

  if (req.fullname) {
    user.fullname = fullName;
  }

  if (req.file) {
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        // configuration of file
        folder: "lms",
        width: 250,
        height: 250,
        gravity: "faces",
        crop: "fill",
      });

      if (result) {
        user.avatar.public_id = result.public_id;
        user.avatar.secure_url = result.secure_url;

        //Remove file from server
        fs.rm(`uploads/${req.file.filename}d`);
      }
    } catch (error) {
      return next(
        new CustomAppError(error || "File not uploades, please try again", 400)
      );
    }
  }
  await user.save();

  res.staus(200).json({
    success: true,
    message: "User details update successfully!",
  });
};
export {
  register,
  login,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  updateUser,
};
