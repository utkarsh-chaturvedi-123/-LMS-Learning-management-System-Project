import { Router } from "express";
import {
    addLectureToCourseById,
  createCourse,
  getAllCourses,
  getLecturesByCourseId,
  removeCourse,
  updateCourse,
} from "../controllers/course.controller.js";
import { authorizedRoles, authorizedSubscriber, isLoggedIn } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/").get(getAllCourses).post(isLoggedIn,authorizedRoles('ADMIN'), upload.single('thumbnail'), createCourse);
// router.route('/').get(getAllCourses).post(createCourse)--> we can write also like this
router
  .get("/:id", isLoggedIn,  authorizedSubscriber, getLecturesByCourseId)
  .put(isLoggedIn,authorizedRoles('ADMIN'), updateCourse) /* data will send as a query param */
  .delete(isLoggedIn,authorizedRoles('ADMIN'), removeCourse)
  .post(isLoggedIn,authorizedRoles('ADMIN'),upload.single('lecture'),addLectureToCourseById);
/* i have used middleware (isLoggedIn) . if you want  before showing the course user should need login. Note --> only showing the course details to the person . not for access the course */

//authorizedRoles('ADMIN') --> this middleware authorize if you are a 'ADMIN'  user then you can  deletion,updation and creationof course

/*we using put and delete in the '/:id' bcz we need id fro updatation of course and deletion of course */
// router.route('/:id').get(getLecturesByCourseId)--> we can write also like this

export default router;
