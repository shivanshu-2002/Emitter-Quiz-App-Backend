const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    image:{type:String,required:true},
    accountType: {
      type: String,
      enum: ['user', 'admin'], // Allowed roles
      default: 'user',
    },
    token: {type: String},
    profile: {
      firstName: { type: String },
      lastName: { type: String },
      dateOfBirth: { type: Date },
    },
    createdAt: { type: Date, default: Date.now },
  });
  
  const User = mongoose.model('User', userSchema);
  
  module.exports = User;

  // languageProgress: { type: mongoose.Schema.Types.ObjectId, ref: 'LanguageProgressSchema' },