const mongoose = require('mongoose');
const Quiz = require('../model/Quiz'); // Import your Quiz model
const Question = require('../model/Question')
const LanguageProgress = require('../model/LanguageProgress')


// Get Quizzes Accoding to your Proficiency level
exports.getQuizList = async (req, res) => {
  try {
    const { skip = 0, limit = 10, filter = '', userProficiencyLevel = 0 } = req.body;

    // Define the pipeline stages
    const pipeline = [];

    // Stage 1: Match based on language filter if provided
    if (filter) {
      pipeline.push({
        $match: { language: filter }
      });
    }

    // Stage 2: Project only specified fields
    pipeline.push({
      $project: {
        title: 1,
        description: 1,
        language: 1,
        questionCount: { $size: "$questions" },
        proficiencyLevel: 1,
      }
    });

    // Stage 3: Match based on user's proficiency level
    if (userProficiencyLevel !== 0) { //for all Case ....dont use this
      pipeline.push({
        $match: {
          proficiencyLevel: {
            $eq: userProficiencyLevel,
          }
        }
      });
    }

    // Stage 4: Skip and Limit for pagination
    pipeline.push(
      { $skip: parseInt(skip) },
      { $limit: parseInt(limit) }
    );

    // Execute the aggregation pipeline
    const quizzes = await Quiz.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      message: 'Quizzes retrieved successfully',
      data: quizzes,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error while fetching quizzes',
    });
  }
};

// Controller to get a single quiz by ID
exports.getQuIzDetails = async (req, res) => {
  try {
    const quizId = req.params;

    const quiz = await Quiz.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(quizId),
        },
      },
      {
        $lookup: {
          from: 'questions', // Assuming your questions collection is named 'questions'
          localField: 'questions',
          foreignField: '_id',
          as: 'questionsDetails',
        },
      },
      {
        $project: {
          questions: 0,
          'questionsDetails.correctOption': 0
        }
      },
    ]);

    if (!quiz || quiz.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Quiz details retrieved successfully',
      data: quiz,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error while fetching quiz details',
    });
  }
};
// Create Quizss...
exports.createQuiz = async (req, res) => {
  try {
    // Extract quiz details and question data from the request body
    const { title, description, language, questions , proficiencyLevel } = req.body;

    // Create questions in the database
    const createdQuestions = await Question.create(questions);
    const questionIds = createdQuestions.map(question => question._id);

    // Create the quiz document and associate question IDs
    const createdQuiz = await Quiz.create({
      title,
      description,
      language,
      questions: questionIds,
      proficiencyLevel:proficiencyLevel
    });

    return res.status(201).json({ success: true, message: 'Quiz and questions created successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.evaluateQuiz = async (req, res) => {
  try {
    const { quizId, userResponses } = req.body;
    const userId = req.user.id; // Assuming user ID is available in req.user
    console.log(userId)
    // Fetch quiz data
    const quiz = await Quiz.findById(new mongoose.Types.ObjectId(quizId)).populate('questions');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    let totalCorrectAnswers = 0;

    // Iterate through user responses
    for (const userResponse of userResponses) {
      const question = quiz.questions.find(q => q._id.toString() === userResponse.questionId);

      // Check if the selected option is provided (not skipped)
      if (userResponse.selectedOption !== null && userResponse.selectedOption !== undefined) {
        // Check if the selected option is correct
        const isCorrect = userResponse.selectedOption === question.correctOption;
        if (isCorrect) {
          totalCorrectAnswers++;
        }
      }
    }

    // Calculate and send the result
    const result = {
      totalQuestions: quiz.questions.length,
      totalCorrectAnswers,
      percentage: (totalCorrectAnswers / quiz.questions.length) * 100,
    };

    // Check if LanguageProgress exists for the user and language
    const languageProgress = await LanguageProgress.findOne({ user: userId, language: quiz.language });

    if (languageProgress) {
      // LanguageProgress exists, check if quiz has been completed before
      const existingExercise = languageProgress.exercises.find(exercise => exercise.exerciseId.equals(quiz._id));

      if (existingExercise) {
        // Quiz already completed, replace existing totalPoints
        languageProgress.totalPoints = languageProgress.totalPoints - existingExercise.score + result.totalCorrectAnswers;
      } else {
        // Quiz not completed before, add new points
        languageProgress.totalPoints += result.totalCorrectAnswers;
      }

      // Update other details
      languageProgress.proficiencyLevel = calculateProficiencyLevel(languageProgress.totalPoints);
      languageProgress.exercises.push({
        title: quiz.title,
        exerciseId: quiz._id,
        score: totalCorrectAnswers,
        completedAt: new Date(),
      });

      await languageProgress.save();
    } else {
      // LanguageProgress doesn't exist, create a new one
      await LanguageProgress.create({
        user: userId,
        language: quiz.language,
        proficiencyLevel: calculateProficiencyLevel(result.totalCorrectAnswers),
        totalPoints: result.totalCorrectAnswers,
        exercises: [
          {
            title: quiz.title,
            exerciseId: quiz._id,
            score: totalCorrectAnswers,
            completedAt: new Date(),
          },
        ],
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User response evaluated successfully',
      result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error while evaluating user response',
    });
  }
};


function calculateProficiencyLevel(totalPoints) {
  if (totalPoints > 400) {
    return 5;
  } else if (totalPoints > 300) {
    return 4;
  } else if (totalPoints > 200) {
    return 3;
  } else if (totalPoints > 100) {
    return 2;
  } else if (totalPoints >= 0) {
    return 1;
  }
}
