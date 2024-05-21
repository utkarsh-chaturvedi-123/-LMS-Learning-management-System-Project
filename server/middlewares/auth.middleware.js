import CustomAppError from "../utils/error.util.js";
import jwt from "jsonwebtoken";

const isLoggedIn = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(
      new CustomAppError("Unauthenticated , please LoggedIn again", 400)
    );
  }

  const userDetails = await jwt.verify(token, process.env.JWT_SECRET);

  req.user = userDetails;

  next();
};

const authorizedRoles = (...roles) =>
  async(req, res, next) => {
  const currentUserRole = req.user.role;
  
  if(!roles.includes(currentUserRole)) {
    return next(
      new CustomAppError("you don't have permission to access this route", 400)
    );

  }
  next();

};

const authorizedSubscriber = async(req, res, next) => {

  const subscription = req.user.subscription;
  const currentUserRole = req.user.role;

  if(currentUserRole !== 'ADMIN' && subscription.status !== 'active') {
    return next(new CustomAppError('Please subscribe to access this route!', 403))
  }
}

export { isLoggedIn, authorizedRoles, authorizedSubscriber };
