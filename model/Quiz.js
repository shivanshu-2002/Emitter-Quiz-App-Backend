const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  language: {
    type: String,
    required: true,
    enum: ['ENGLISH', 'HINDI', 'FRENCH', 'SPANISH'],
  },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  proficiencyLevel: { type: Number, default: 1 }, // Proficiency level added with a default value
  createdAt: { type: Date, default: Date.now },
});

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;
