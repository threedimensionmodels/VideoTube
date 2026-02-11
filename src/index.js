import dotenv from "dotenv";

import connectDB from "./db/db.js";
import {app} from "./app.js"

dotenv.config({
  path: "./.env",
});


connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`🕸️ Server is running at port ${process.env.PORT} `);
    });
  })
  .catch((error) => {
    console.log("MONGO db Connection Failed !!! ", error);
  });
/*
(async ()=>{
    try {
       await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)

       app.on("error",(error)=>{
        console.log("Error: " , error );
        throw error 
       })

       app.listen(process.env.PORT,()=>{
        console.log(`App is listening on port ${process.env.PORT}`);
        
       })

    } catch (error) {
        console.error("ERROR: " ,error)
        throw err
    }
})()
*/
