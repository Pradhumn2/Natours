const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs"); // for password encryption

const userSechema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
  },
  email: {
    type: String,
    required: [true, "Please tell us your email!"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email!"],
  },
  photo: {
    String,
  },
  role: {
    type: String,
    enum: ["user", "admin", "guide", "lead-guide"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please provide a password!"],
    minlength: 8,
    select: false, // To not show in output
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please provide a password!"],
    validate: {
      // This only work on CREATE and SAVE!!
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same!",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false     // Hide from others
  }
});

// We use a middleware for handle passsword encryption,
// which handle it in b/w we recive the data and saving it to DB.

userSechema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12); // phash the password with a cost of 12

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSechema.pre('save' , function (next){
  if(!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; //To overlap the gap b/w change in token and change in password we sub 1sec
  next();
});

userSechema.pre(/^find/ , function(next){
  this.find({active:{$ne:false}});
  next();
})

userSechema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  // this.password  >> not avaliable , cox select = false is marked
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSechema.methods.changedPasswordAfter = async function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp; // 100ms initial then changed at 200ms so, 100 < 200
  }
  return false;
};

userSechema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");

//   console.log({resetToken} , this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10*60*1000; //(10 min, 60 sec, 1000 ms => 10 min)

  return resetToken;
};

const User = mongoose.model("User", userSechema);

module.exports = User;
