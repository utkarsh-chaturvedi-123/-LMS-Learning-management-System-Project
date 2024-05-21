import Payment from "../model/payment.model.js";
import User from "../model/user.model.js";
import { razorpay } from "../server.js";
import CustomAppError from "../utils/error.util.js";
import crypto from "crypto";

export const getRazorpayApiKay = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Razorpay API kay",
    key: process.env.RAZORPAY_KEY_ID,
  });
};

export const buySbscription = async (req, res, next) => {
  try {
    const { id } = req.user;
    const user = await User.findById(id);

    if (!user) {
      return next(new CustomAppError(error || "UnAuthorized , Please Login"));
    }
    if (user.role === "ADMIN") {
      return next(
        new CustomAppError(error || "Admin can not purchase subscription", 400)
      );
    }
    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      customer_notify: 1,
    });

    user.subscription.id = subscription.id;
    user.subscription.status = subscription.status;

    await user.save();

    res.status(200).json({
      success: true,
      message: "subscribed successfully",
      subscription_id: subscription.id, // this will generate a subscription id on razorpay
    });
  } catch (error) {
    return next(new CustomAppError(error.message, 500));
  }
};

export const verifySbscription = async (req, res, next) => {
  try {
    const { id } = req.user;
    const {
      razorpay_payment_id,
      razorpay_signature,
      razorpay_subscription_id,
    } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return next(new CustomAppError("Unauthorized, Please login", 500));
    }

    const subscriptionID = user.subscription.id; //this subscription id also on the razorpay

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_payment_id} | ${subscriptionID}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return next(
        new CustomAppError("Payment not verified, Please try again", 500)
      );
    }

    // this code is for if payment is done then create entry
    await Payment.create({
      razorpay_payment_id,
      razorpay_signature,
      razorpay_subscription_id,
    });

    user.subscription.status = "active"; //this is for razorpay status 'update' from 'created' status
    await user.save();

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (error) {
    return next(new CustomAppError(error.message, 500));
  }
};

export const cancelSubscription = async (req, res, next) => {
  try {
    const { id } = req.user;

    const user = await User.findById(id);

    if (!user) {
      return next(new CustomAppError(error || "UnAuthorized , Please Login"));
    }
    if (user.role === "ADMIN") {
      return next(
        new CustomAppError(error || "Admin can not purchase subscription", 400)
      );
    }
    const subscriptionID = user.subscription.id;

    const subscription = await razorpay.subscriptions.cancel(subscriptionID);

    user.subscription.status = subscription.status;

    await user.save();
  } catch (error) {
    return next(new CustomAppError(error.message, 500));
  }
};

export const allPayments = async (req, res, next) => {
    try {
        const { count } = req.query;

    const subscriptions = await razorpay.subscriptions.all({

        count: count || 10,
    });

    res.status(200).json({
        success: true,
        message: 'All Payments',
        subscriptions
    });
    } catch (error) {
        return next(new CustomAppError(error.message, 500));
  
    }
};
