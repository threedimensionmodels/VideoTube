import mongoose , {Schema} from "mongoose";

const subscriptionShema = new mongoose.Schema({
    subscriber:{
        type: Schema.Types.ObjectId, // one who is subscribing
        ref: "User"
    },
    channel:{
        type: Schema.Types.ObjectId,
        ref: "User"
    }
},{timestamps: true})



export const Subscription = mongoose.model("Subscription", subscriptionShema)