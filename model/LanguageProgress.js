const mongoose = require("mongoose");

const languageProgressSchema = new mongoose.Schema({
    user :{type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    language: { type: String, required: true },
    proficiencyLevel: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    exercises: [
      {
        title:{type:String,trim:true},
        exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
        score: { type: Number, default: 0 },
        completedAt: { type: Date },
      },
    ],
  });


  const LanguageProgressSchema = mongoose.model('LanguageProgressSchema', languageProgressSchema);
  
  module.exports = LanguageProgressSchema;