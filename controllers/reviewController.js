const Review = require("../models/reviewModel");
const catchAsync = require('../utils/catchAsync');
// const AppError = require("../utils/appError");
const { param } = require("../app");
const factory = require("./handleFactory");

// I am not gonna add create Review in factoryhandle due to these if conditiond, but we can do so, by putting 
// these conditon in a middleware and then just pass that middleware in routes before create funciton
exports.createReview = catchAsync(async(req, res, next) => {
    //Allow nested routes
    if(!req.body.tour) req.body.tour = req.params.tourId;
    if(!req.body.user) req.body.user = req.user.id;
    
    const newReview = await Review.create(req.body);
    
    res.status(201).json({
        status:"success",
        data:{
            newReview
        }
    });
});

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);