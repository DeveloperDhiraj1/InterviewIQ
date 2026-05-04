import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  credits: {
    type: Number,
    default: 100
  },
  resetPasswordToken: {
    type: String,
    select: false,
  },
  resetPasswordExpire: Date,
}, { timestamps: true });

export default mongoose.model("User", userSchema);