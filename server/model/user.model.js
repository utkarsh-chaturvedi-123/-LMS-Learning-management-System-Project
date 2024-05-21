import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new Schema(
  {
    fullname: {
      type: "String",
      required: [true, "Name is required"],
      minLength: [5, "Name must be at least 5 characted"],
      lowercase: true,
      trim: true,
    },
    email: {
      type: "String",
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      unique: true,
      match: [
        /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
        " please fill a valid email address",
      ] /* this for custom for example --> if you want to  validate your corporate mail ID */,
    },
    password: {
      type: "String",
      required: [true, "password is required"],
      minLength: [8, "password must be at least 8 character"],
      select: false /* this will not give password by default until  you want to extract password explacitely*/,
    },
    avatar: {
      public_id: {
        type: "String",
      },
      secure_url: {
        type: "String",
      },
    },
    role: {
      type: "String",
      enum: ["USER", "ADMIN"],
      default: "User",
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
    subscription: {
      id: String, //user subscription details for course
      status: String
    }
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods = {
  generateJWTToken: async function () {
    return await jwt.sign(
      {
        id: this._id,
        email: this.email,
        subscription: this.subscription,
        role: this.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRY,
      }
    );
  },
  comparePassword: async function (plainTextPassword) {
    return await bcrypt.compare(plainTextPassword, this.password);
  },

  // this is for forgot password and reset token
  generatePasswordResetToken: async function () {
    const resetToken = crypto.randomBytes(20).toString("hex"); // this will generate 20 random character bcz 1 character is 1 byte
    // we are encrypting from crypto for security
    this.forgotPasswordToken = crypto
      .createHash("sha256") //sha256 --> we are encrypting hash with tthe sha256 algorithm
      .update(resetToken)
      .digest("hex");
    /*hashToken: This function takes a token as input and hashes it using the SHA-256 algorithm. It first creates a hash object using crypto.createHash('sha256'), then updates the hash with the token using .update(token), and finally computes the digest (hash) in hexadecimal format using .digest('hex'). The resulting hashed token is a fixed-length string of 64 characters, representing the hexadecimal digest of the input token. */
    this.forgotPasswordExpiry = Date.now() + 15 * 60 * 1000; // 15 minute from now

    return resetToken;
  },
};

const User = model("User", userSchema);

export default User;
