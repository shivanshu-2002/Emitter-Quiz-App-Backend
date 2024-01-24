const express = require("express")
const router = express.Router()

const {
    getQuizList,createQuiz,getQuIzDetails,evaluateQuiz
} = require("../controller/Quiz")

const { auth}  = require('../middleware/auth')


router.post("/getQuizList", getQuizList)
router.post("/createQuiz",auth, createQuiz)
router.get("/getQuIzDetails/:id",auth, getQuIzDetails)
router.post("/evaluateQuiz",auth, evaluateQuiz)



module.exports = router