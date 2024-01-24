const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const database = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
//database connect
database.connect();
//middlewares
app.use(
    express.urlencoded({ extended: true })
);
    
app.use(express.json());
app.use(cookieParser());
app.use(
	cors({
	  origin: ['http://localhost:5173', 'https://emitter-front-end.vercel.app','*','https://emitter-front-ie17izg4v-shivanshu-2002.vercel.app'],
	  credentials: true,
	})
  );
// Importing the routes
const authRoutes = require("./routes/auth");
const quizRoutes = require("./routes/quiz")
const userRoutes = require('./routes/user')

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/quiz", quizRoutes);
app.use("/api/v1/user", userRoutes);

app.get("/test-cookies", (req, res) => {
    console.log("Cookies:", req.cookies);
    res.send("Check your console for cookies");
});


app.get("/", (req, res) => {
	return res.json({
		success:true,
		message:'Your server is up and running....'
	});
});

app.listen(PORT, () => {
	console.log(`App is running at ${PORT}`)
})