const User = require("../model/User");
const LanguageProgress = require("../model/LanguageProgress")
const mongoose = require('mongoose')

exports.getUserProfile = async (req, res) => {
  try {
    // Fetch user details from the database using the user ID from the request
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    // Exclude sensitive information (e.g., password) before sending the response
    const userWithoutSensitiveInfo = {
      username: user.username,
      email: user.email,
      role: user.role,
      image:user.image,
      profile:user.profile
      // Add other non-sensitive user details as needed
    };

    return res.status(200).json({
      success: true,
      user: userWithoutSensitiveInfo,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user details',
    });
  }
};
exports.getUserProgress = async (req, res) => {
    try {
      const userId = new mongoose.Types.ObjectId(req.user.id);
      // Aggregation pipeline to filter language progress based on the user ID
      const aggregationPipeline = [
        {
          $match: {
            user: userId,
          },
        },
        {
          $project: {
            language: 1,
            totalPoints: 1,
            proficiencyLevel: 1,
          },
        },
      ];
  
      // Execute the aggregation pipeline
      const languageProgress = await LanguageProgress.aggregate(aggregationPipeline);
  
      return res.status(200).json({
        success: true,
        languageProgress,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching user language progress',
      });
    }
}; 
exports.prevQuizes = async (req, res) => {
    try {
      const userId = new mongoose.Types.ObjectId(req.user.id); 
      const { skip = 0, limit = 10 } = req.body;
  
      const result = await LanguageProgress.aggregate(
        [
              {
                $match: {
                  user: userId,
                },
              },
              {
                $project: {
                  exercises: 1,
                },
              },
              {
                $unwind: '$exercises',
              },
              {
                $sort: {
                  'exercises.completedAt': -1,
                },
              },
              {
                $group: {
                  _id: null,
                  totalExercises: { $push: '$exercises' },
                },
              },
              {
                $project: {
                  _id: 0,
                  totalExercises: 1,
                },
              },
              {
                $unwind: '$totalExercises',
              },
              {
                $replaceRoot: { newRoot: '$totalExercises' },
              },
              {
                $skip: skip,
              },
              {
                $limit: limit,
              }
            ]);
  
      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User exercises not found',
        });
      }
  
      return res.status(200).json({
        success: true,
        message: 'User exercises retrieved successfully',
        data: result,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Error while fetching user exercises',
      });
    }
  };

exports.leaderboard = async (req, res) => {
  try {
    const topUsers = await LanguageProgress.aggregate([
      {
        $group: {
          _id: "$user",
          totalPoints: { $sum: "$totalPoints" }
        }
      },
      {
        $lookup: {
          from: "users", // Replace with the actual name of your users collection
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $project: {
          _id: 1,
          totalPoints: 1,
          userName: { $arrayElemAt: ['$userDetails.username', 0] },
          userImage:{$arrayElemAt:['$userDetails.image', 0]}
        }
      },
      {
        $sort: { totalPoints: -1 }
      },
      {
        $limit: 3
      }
    ]);

    return res.status(200).json({
      success: true,
      message: 'Leaderboard retrieved successfully',
      data: topUsers
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error while fetching leaderboard'
    });
  }
};
