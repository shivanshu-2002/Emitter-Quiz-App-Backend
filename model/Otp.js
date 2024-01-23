const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const otpTemplate = require("../utils/mail/emailVerificationFormat");

const OTPSchema = new mongoose.Schema({
        email:{
            type:String,
            required:true
        },
        otp:{
          type:String,
          required:true
        },
        createdAt: {
          type: Date,
          default: Date.now,
          expires: 300, // 5 minutes in seconds (5 * 60)
        }
});

async function sendVerificationMail(email,otp){
  try{ 
   const emailfield = otpTemplate(otp);
     const mailResponse = await mailSender(email,"Verification Email from Pandey",emailfield);
     console.log("Mail Send Successfully! ",mailResponse)
  } catch(error){
     console.log("Error Ocured while Sending the mail ",error);
     throw error;
  }
}
// THis has the value of current instance...
OTPSchema.pre("save",async function(next){
  await sendVerificationMail(this.email,this.otp);
  next();
})



module.exports = mongoose.model("OTP",OTPSchema);