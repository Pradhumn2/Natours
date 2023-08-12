const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id, req.body);

    if (!doc) {
      return next(new AppError("No tour found with that ID", 404));
    }

    res.status(204).json({
      message: "Data Deleted",
      data: {
        tour: null,
      },
    });
  });

exports.updateOne = Model =>
catchAsync(async (req, res, next) => {
    // learn from documentation of mongoose
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if(!doc){
      return next(new AppError('No document found with that ID' , 404));
    }

    res.status(200).json({
      status: "sucess",
      data: {
        doc,
      },
    });
});

exports.getOne = (Model , popOptions) =>
catchAsync (async (req, res, next) => {
    let query = Model.findById(req.params.id);
    
    if(popOptions) query = query.populate(popOptions);

    const doc = await query;  

    // or doc.findOne({_id: req.params.id});

    if(!doc){
      // console.log(doc);
      return next(new AppError('No document found with that ID' , 404));
    }
    
    res.status(200).json({
      status: "sucess",
      data: {
        doc,
      },
    });
});

exports.getAll = Model =>
catchAsync( async (req, res, next) => {

    //Allow nested routes for GET reviews in tour
    let filter = {};
    if(req.params.tourId) filter = {tour: req.params.tourId}


    // const tours = await Tour.find({     >> normal way to apply queries/filters in tours
    //   duration:5,
    //   difficulty:'easy'
    // });

    // console.log(req.query);
    // BUILD QUERY

    // // 1A) FILTERING
    // const queryObj = { ...req.query };
    // const excludedField = ["page", "sort", "limit", "fields"];
    // excludedField.forEach((el) => delete queryObj[el]);

    //1B)ADVANCED FILTERING
    // let queryStr = JSON.stringify(queryObj);
    // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // console.log(JSON.parse(queryStr));

    // let query = Tour.find(JSON.parse(queryStr));

    // 2) SORTING
    // if (req.query.sort) {
    //   const sortBy = req.query.sort.split(",").join(" ");
    //   console.log(sortBy);
    //   query = query.sort(sortBy);
    // sort('price ratingAverage')
    // } else {
    //   query = query.sort("-createdAT");
    // }

    // 3) FIELD LIMITING.

    // if(req.query.fields){
    //   const fields = req.query.fields.split(',').join(' ');
    //   query = query.select(fields);
    // } else {
    //   query = query.select('-__v');
    // }

    // 4) PAGINATION

    // const page = req.query.page*1 || 1;
    // const limit = req.query.limit*1 || 100;
    // const skip = (page - 1)*limit;

    // // page=2&limit=10 , 1-10 page1 , 11-20 page2 ....
    // query = query.skip(skip).limit(limit);

    // if(req.query.page){
    //   const numTours = await Tour.countDocuments();
    //   if(skip >= numTours) throw new Error('This page doesn not exist');
    // }

    //EXECUTE QUERY

    const features = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;
    // const doc = await features.query.explain();

    //SEND RESPONSE

    res.status(200).json({
      status: "sucess",
      data: {
        doc,
      },
    });
});