// import { error } from "console";
import Course from "../model/course.model.js";
import CustomAppError from "../utils/error.util.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";

const getAllCourses = async function (req, res, next) {
  try {
    const courses = await Course.find({}).select("-lectures"); // accessing all courses but select('-lectures') -> this is ignoring List of lectures by minus(-)

    res.status(200).json({
      success: true,
      message: "All courses",
      courses,
    });
  } catch (error) {
    return next(new CustomAppError(error.message, 500));
  }
};

const getLecturesByCourseId = async function (req, res, next) {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);

    if (!course) {
      return next(new CustomAppError("course not found", 400));
    }

    res.status(200).json({
      success: true,
      message: "Course Lecture fetched successfully",
      lectures: course.lectures,
    });
  } catch (error) {
    return next(new CustomAppError(error.message, 500));
  }
};

const createCourse = async (req, res, next) => {
  const { title, description, category, createdBy } = req.body;

  if (!title || !description || !category || !createdBy) {
    return next(new CustomAppError("All fields are required", 400));
  }

  const course = await Course.create({
    title,
    description,
    category,
    createdBy,
    thumbnail: {
      public_id: "Dummy",
      secure_url: "Dummy",
      // we have set dummy value in the thumbnail because we have set 'required: true' in the course.model.js.
      // if i dont use this field inside this file . this will show the error.
    },
  });

  if (!course) {
    return next(
      new CustomAppError("course could not create, please try again", 500)
    );
  }
  //this is for image(thumbnail) upload in the cloudinary.
  if (req.file) {
    try {
      const result = await cloudinary.v2.upload(req.file.path, {
        folder: "lms",
      }); //we can add a more configuration for file.

      if (result) {
        course.thumbnail.public_id = result.public_id;
        course.thumbnail.secure_url = result.secure_url;
      }
      fs.rm(`uploads/${req.file.filename}`);
    } catch (error) {
      return next(new CustomAppError(error.message, 500));
    }
  }

  await course.save();

  res.status(200).json({
    success: true,
    message: "course created successfully",
    course,
  });
};

const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndUpdate(
      id,
      {
        $set: req.body, // this will get the data from the body and set or override or modify or update the only give data not a whole data need to modify by the admin or user(like - title, description , createdby etc) in the mongodb.
      },
      {
        runValidators: true, //this will check the validation,  the new data is getting correct by given structure of mongodb model or not.
      }
    );

    if (!course) {
      return next(
        new CustomAppError("course with given id does not exist", 500)
      );
    }

    res.status(200).json({
      success: true,
      message: "Course updated successfully!",
      course,
    });
  } catch (error) {
    return next(new CustomAppError(error.message, 500));
  }
};

const removeCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);

    if (!course) {
      return next(
        new CustomAppError("course with given id does not exist", 500)
      );
    }
    await Course.findByIdAndDelete(id); // here we are using capital 'C' in 'Course' bcz we finding the id from whole Course in the database.

    res.status(200).json({
      success: true,
      message: "course deleted successfully!",
    });
  } catch (error) {
    return next(new CustomAppError(error.message, 500));
  }
};

const addLectureToCourseById = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const { id } = req.params;

    if (!title || !description) {
      return next(new CustomAppError("All fields are required", 400));
    }

    const course = await Course.findById(id);

    if (!course) {
      return next(
        new CustomAppError("course with given id does not exist", 500)
      );
    }

    const lectureData = {
      title,
      description,
      lecture: {},
    };

    if (req.file) {
      try {
        const result = await cloudinary.v2.upload(req.file.path, {
          folder: "lms",
        }); //we can add a more configuration for file

        if (result) {
          lectureData.lecture.public_id = result.public_id;
          lectureData.lecture.secure_url = result.secure_url;
        }
        fs.rm(`uploads/${req.file.filename}`);
      } catch (error) {
        return next(new CustomAppError(error.message, 500));
      }
    }
    course.lectures.push(lectureData);

    course.numberOfLectures = course.lectures.length;

    await course.save();

    res.status(200).json({
      success: true,
      message: "Lecture successfully added to the course",
      course,
    });
  } catch (error) {
    return next(new CustomAppError(error.message, 500));
  }
};

export {
  getAllCourses,
  getLecturesByCourseId,
  createCourse,
  updateCourse,
  removeCourse,
  addLectureToCourseById,
};
