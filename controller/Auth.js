const User = require("../model/User");
const OTP = require("../model/Otp");
const otpGenerator = require("otp-generator");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
require("dotenv").config();



//otpverification
exports.sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
       
        const isPresent = await User.findOne({ email });

        if (isPresent) {
            return res.status(401).json({
                success: false,
                message: "User already exist"
            });
        }

        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        });
        console.log("Otp Generated Succesfully ", otp);

        let result = await OTP.findOne({ otp: otp });

        while (result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false
            });
            result = await OTP.findOne({ otp: otp });
        }
        console.log("Otp Generated Succesfully ", otp);

        const otpPayload = {
            email, otp
        }

        // Create entry in db .
        const response = await OTP.create(otpPayload);


        console.log("Otpgenerator", response);

        return res.status(200).json({
            success: true,
            message: 'Otp Sent Successfully',
            otp
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error.message,
            success: false
        })
    }
}
// signup
exports.signUp = async (req, res) => {
    try {
        //  fetch data from request ..
        const {
            username,
            firstName,
            lastName,
            dateOfBirth,
            password,
            email,
            confirmPassword,
            otp
        } = req.body;

        // VALIDATE THE DATA ,,
        if (!username || !password || !email || !confirmPassword || !otp) {
            return res.status(403).json({
                success: false,
                message: "All fields are required"
            })
        }

        // match 2 password..
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password and confirm Password Not matches"
            })
        }

        //  Check if user already exist or not ..
        const checkUser = await User.findOne({ email: email });
        if (checkUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            })
        }

        //  find the most recent otp  ...
        const recentOTP = await OTP.findOne({ email: email }).sort({ createdAt: -1 }).limit(1);

        if (recentOTP.length === 0) {
            return res.status(400).json({
                message: "Otp not found",
                success: false
            })
        } else if (recentOTP.otp !== otp) {
            return res.status(400).json({
                message: "Otp not matches",
                success: false
            })
        }

        // Hash password  ...
        const hashedPassword = await bcrypt.hash(password, 10);


        // Create entry in DB 
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
            profile: {
                firstName,
                lastName,
                dateOfBirth,
            },
           
        })
        // return response..
        return res.status(200).json({
            success: true,
            message: "User registered Successfully"
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "User Can not be registered !"
        })
    }
}

// login
exports.login = async (req, res) => {
    try {
        //    fetch the data 
        const { email, password } = req.body;
        // Validate the data 
        if (!email || !password) {
            return res.status(403).json({
                success: false,
                message: "All fields are required"
            })
        }
        
        // check if user exist 
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User does not exist"
            })
        }


        // if password matches
        if (await bcrypt.compare(password, user.password)) {
            // generate jwt token
            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType
            }
            console.log(payload)

            const token =  jwt.sign(payload, process.env.JWT_SECRET,
                {
                    expiresIn: "2h",
                })

            user.token = token;
            user.password = undefined;

            const options = {
                maxAge: 3 * 24 * 60 * 60 * 1000, // Set the cookie to expire in 3 days (3 * 24 hours * 60 minutes * 60 seconds * 1000 milliseconds)
                httpOnly: true,
            };

            // save it in a cookie and send the response
            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message: "Logged In Successfully",
            });
        }
        // You can write the else block here..if password is incorrect 
        else {
            console.log("hello")
            return res.status(401).json({
                success: false,
                message: "Password Not matches"
            })
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Login Failed"
        })
    }
}