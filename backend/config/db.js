import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/OnShow`);
        console.log("Successfully connected to MongoDB!");
    } catch (error) {
        console.log("MongoDB connection failed!");
        console.log(error.message);
    }
}

export default connectDB;