class CustomAppError extends Error {
  constructor(message, statuscode) {
    super(message);

    this.statuscode = statuscode;

    Error.captureStackTrace(
      this,
      this.constructor
    ); /* captureStackTrace()--> this is for if i want to trace the server error , this will show the full details of server error like (error in which file or which line  etc...)  */
  }
}
export default CustomAppError;
/* constructor calling  from user.controller.js file */
//const error = new CustomAppError('some error message', 404) --> we are passing 2 argument(first is 'message' , second is 'statuscode') in constructor bcz we have create 2 parameterize constructor
