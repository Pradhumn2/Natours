const User = require("../models/userModel");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");
const errorController = require("./errorController");
const { decode } = require("punycode");
const crypto = require("crypto");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  //Cookie: Small piece of text that a server sent to a client, then when a client recives a cookie it
  //will automatically store it ans automatically sent back along with all future req to the srver
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // secure: true, //Cookie only be send in encrypted connection
    httpOnly: true, //Cookie can't be accessed and modified by browser
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  //To remove password from the output
  user.password = undefined;
  
  res.status(statusCode).json({
    status: "sucess",
    token,
    data: {
      user,
    },
  });
};

exports.singup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  // console.log('Role is ' , req.body.role);

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body; // obj destructring

  // 1.) check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }
  // 2.) check if user exist and password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrct email or password", 401));
  }

  // 3.) if everything ok, send the token to client
  createSendToken(user, 200, res);
});

// Middleware to provide access of getting tour info to only loggined users
exports.protect = catchAsync(async (req, res, next) => {
  //1. Getting token and check if it is there or not
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("Your are not logged in! Please to get access."));
  }
  //2. Verification of token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log('decodec data' , decoded);

  //3. Check if user still exists
  const currentUser = await User.findById(decoded.id);
  // console.log(currentUser);
  if (!currentUser) {
    return next(
      new AppError(
        "The User belonging to this token does no longer exist.",
        401
      )
    );
  }
  //4. Check if user change the password after token was issued

  if (currentUser.changedPasswordAfter(decode.iat) === true) {
    return next(
      new AppError("User recently changed password! Please login again", 401)
    );
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

// We want to pass the arguments (admin , lead-guide) but middleware doesn't support this.
// So, we'll just create a wrap up function which will then return middleware function
exports.restrictTo = (...roles) => {
  //roles = ["admin" , "lead-guide"]
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("Do not have permission to perform this action!", 401)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1. Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("No user exits with this email!", 404));
  }

  //2. Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  // uptil now we had just modified the data but hasn't saved it,
  //now by doing so we are saving it + we had done all validations false
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  // here req.protocol == http || https
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request
  with your new password and passwordConfirm to: ${resetURL}. \n 
  If you didn't forget your password, please ignore this email !`;

  // console.log("working till here" , resetURL);

  try {
    await sendEmail({
      email: user.email, // or req.body.email
      subject: "Your password reset token (valid for 10 mins)",
      message: message,
    });

    res.status(200).json({
      status: "sucess",
      message: "Token sent to email!",
    });
  } catch (err) {
    (user.passwordResetToken = undefined),
      (user.passwordResetExpires = undefined),
      await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error in sending the email. Try later!"),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1. Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2.If token has not expired and there is user, set the password

  if (!user) {
    return next(new AppError("Token is invalid or expired!", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;

  await user.save(); // In this case we don't need to set validators false , coz we need them
  //3.Update changePassordAt property of user
  //4.Log the user in, send JWT

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1.Get User from collection
  const user = await User.findById(req.user.id).select("+password");

  //2.Check if the posted Password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current Password is Wrong!", 401));
  }

  //3.if so , Update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();

  //4.Log user in, send JWT
  createSendToken(user, 200, res);
});
