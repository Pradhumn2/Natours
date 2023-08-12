// const fs = require("fs");
const Tour = require("../models/tourModel");
const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handleFactory");

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-sample.json`)
// );
// //  ^                             ^
// // Convert data into JSON format   read data or string object from tours-sample

// exports.checkBody = (req , res , next) => {
//   if(!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price'
//     })
//   }
//   next();
// }

exports.createNewTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: "sucess",
    data: {
      tour: newTour,
    },
  });

  // try {
  //   const newTour = await Tour.create(req.body);
  //   res.status(201).json({
  //     status: "sucess",
  //     data: {
  //       tour: newTour,
  //     },
  //   });
  // } catch (err) {
  //   res.status(400).json({
  //     status: "fail",
  //     message: "Invalid data sent !",
  //   });
  // }
});

exports.getTour = factory.getOne(Tour, { path: "reviews" }); // path specify the filed which we want populate
exports.updateTours = factory.updateOne(Tour);
exports.deleteTours = factory.deleteOne(Tour);
exports.getAllTours = factory.getAll(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: "$difficulty",
        numRatings: { $sum: "$ratingsQuantity" },
        numTours: { $sum: 1 },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'easy' } }
    // }
  ]);
  // console.log(stats);
  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});

exports.getMonthyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStarts: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      $project: {
        _id: 0, // >> ni longer shown up
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    // {
    //   $limit: 6/7
    // }
  ]);

  res.status(200).json({
    status: "success",
    data: {
      plan,
    },
  });
});

// "/tours-within/:distance/center/:latlng/unit/:unit"
// /tours-within/233/center/37.3111,-45.334/unit/mi

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");

  if (!lat || !lng) {
    next(
      new AppError(
        "Please provide latitude and longitude in the format lat,lang.",
        404
      )
    );
  }

  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1; // here radius is in radian so, divide dist by radius of earth to ger in radian

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: " success",
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");

  if (!lat || !lng) {
    next(
      new AppError(
        "Please provide latitude and longitude in the format lat,lang.",
        404
      )
    );
  }

  const multiplier = unit === 'mi' ? 0.0006213712 : 0.001;

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: "distance",
        distanceMultiplier: multiplier // Multiply distance by given no. (do that to convert distance in res to km)
      }
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    }
  ]);

  res.status(200).json({
    status: " success",
    data: {
      data: distances,
    },
  });
});
