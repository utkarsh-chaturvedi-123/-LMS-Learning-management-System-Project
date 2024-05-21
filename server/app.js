import cors from "cors";
import morgan from "morgan";
import express from "express";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import courseRoutes from "./routes/course.routes.js";
import paymentRoutes from "./routes/payment.routes.js"

const app = express();

// connectionToDb();
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    Credentials: true,
  })
);

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan("dev")
); /* give information in console ,which URL user trying to access */
app.use("/ping", (req, res) => {
  res.send("JWT Server is running up");
});

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/paymants", paymentRoutes);

/* if hit another URL which is not exist */
/*if we use '/' then this function will not work ,you need to add '/firstRoute' */
app.all("*", (req, res) => {
  res.status(404).send("oops!! 404 page not fond");
});
app.use(errorMiddleware);

export default app;
