import mongoose, {Schema} from "mongoose"; 

const subsriptionSchema = new Schema({

    subscriber:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    channel:{
        type: Schema.Types.ObjectId,
        ref: "Channel"
    }
}, {timestamps: true});


export const Subsription = mongoose.model("Subsription", subsriptionSchema);