import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async ()=>{
    try {
        const connectionistance =  await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB Host : ${connectionistance.connection.host}`)
        
    } catch (error) {
        console.log("MongoDB connection Failed ", error);
        process.exit(1)
        
    }
}

export default connectDB