import { Router } from "express";
import { allPayments, buySbscription, cancelSubscription, getRazorpayApiKay, verifySbscription } from "../controllers/payment.controller.js";
import { authorizedRoles, isLoggedIn } from "../middlewares/auth.middleware.js";

const router = Router();

router
.route('/razorpay-key')
.get(
    isLoggedIn,
    getRazorpayApiKay);

router
.route('/subscribe')
.post(
    isLoggedIn,
    buySbscription);

router
.route('/verify')
.post(
    isLoggedIn,
    verifySbscription);

router
.route('/unsubscribe')
.post(
    isLoggedIn,
    cancelSubscription);

router
.route('/')
.get(
    isLoggedIn,
    authorizedRoles('ADMIN'),
    allPayments);

export default router;