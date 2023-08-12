const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handleFactory");

const filterObj = (obj , ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
      if(allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}


exports.updateMe = async(req, res, next) => {
  //1. If user try to update password throw an error
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password update. Please use /updateMyPassword !"
        ),
        400
        );
      }
      
      //2.Filtered out unwanted fields name , that we don't want user to access
      const filterBody = filterObj(req.body, "name", "email"); 
      
      //3.Update user documents
      const updatedUser = await User.findByIdAndUpdate(req.user.id , filterBody , {
        new: true,
        runValidators: true
      });
      
      res.status(200).json({
        status: "sucess",
    data: {
      user: updatedUser
    }
  });
};

exports.getMe = (req, res, next) => {    // We don't need to make new function here
  req.params.id = req.user.id;           // just pass userId as paramsId in getOne function
  next();                                // and it returns the user, and that's why we use this middleware here
};

exports.deleteMe = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id , {active: false});
  res.status(204).json({
    status: "sucess",
    data: null
  });
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.deleteUser = factory.deleteOne(User);
