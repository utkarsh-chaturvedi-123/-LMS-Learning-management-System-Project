import mongoose from "mongoose";

mongoose.set(
  "strictQuery",
  false
); /* used bcz if we fetch or store the data by using query and data is not exist in the database so, don't give me error 
      and send nothing  */

const connectionToDb = async () => {
  try {
    const { connection } = await mongoose.connect(process.env.MONGO_URI);

    if (connection) {
      console.log(`Connected to MongoDB: ${connection.host}`);
    }
  } catch (error) {
    console.log(`connection failed!! ${error}`);
    process.exit(1); /* this line will terminate the server */
  }
};
export default connectionToDb;
