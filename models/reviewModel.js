const mongoose = require("mongoose");
const Tour = require("./tourModel");
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      require: [true, "Please review your tour!"],
    },
    rating: {
      type: Number,
      max: 5,
      min: 1,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      require: [true, "Review must belongs to a Tour!"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      require: [true, "Review must belongs to a User!"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.pre(/^find/, function (next) {  // populating 2 different DB simaltenously (user and tour)
//   this.populate({
//     path: 'tour',
//     select:'name'
//   }).populate({
//     path:'user',
//     select:'name photo'
//   })

  this.populate({
    path:'user',
    select:'name photo'
  });

  next();
});

//Here we use statics method not instance method for getting avg of reviews
reviewSchema.statics.calcAverageRating = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId}
    },
    {
      $group: {
        _id: '$tour',         // group by tour id's
        nRating: {$sum : 1},   // increment count of ratings
        avgRating: { $avg: '$rating'}  // take avg of rating from reviewModel
      }
    }
  ]);
  // console.log(stats);
 
  if(stats.length > 0){
    await Tour.findByIdAndUpdate(tourId , {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  }
  else{
    await Tour.findByIdAndUpdate(tourId , {
      ratingsQuantity: 0,
      ratingsAverage: 0
    });
  }
};

reviewSchema.post('save' , function(){   //We use post not pre, coz we wanna do this operation after saving the data, not before
  //this point to current reviews
  this.constructor.calcAverageRating(this.tour);
});

//FindByIdAndUpdate
//FindByIdAndDelete

reviewSchema.pre(/^findOneAnd/ , async function(next) {
  this.r = await this.findOne();            // We need to use r in next function , that's why we pass here this.r as parameter of function
  console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/ , async function() {
  // await this.findOne() does not execute here cuz query has already executed
  await this.r.constructor.calcAverageRating(this.r.tour);
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
