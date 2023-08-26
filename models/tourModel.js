const mongoose = require("mongoose");
const slugify = require("slugify");
const User = require("./userModel");

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      trim: true,
      // VALIDATORS
      required: [true, "A tour must have a name"],
      maxlength: [40, "A tour name must have less then or equal 40 char"],
      minlength: [10, "A tour name must have more then or equal 10 char"],
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message:
          "Difficulty must be either one of these : easy , medium , difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: val => Math.round(val)*10 / 10
    },
    ratingsQuantity: {
      type: Number,
      defult: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: "discount price ({VALUE}) should be below regular price",
      },
    },
    summary: {
      type: String,
      required: [true, "A tour must have a summary"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover Image"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    // Embedding Document (location)
    startLocation: {
      //GeoJSON for Geospatial Data
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number], //Longitudes then Latitudes
      address: String,
      description: String,
    },
    location: [
      {
        //GeoJSON for Geospatial Data
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number], //Longitudes then Latitudes
        address: String,
        description: String,
        day: Number  // day of tour
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,    // Valid id of an object
        ref: 'User'             // Referencing to establish relation with other seperated DB i.e, user
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.index({price: 1, ratingsAverage: -1 , slug: -1});   

tourSchema.index({tour: 1, user: 1} , {unique: true});  

tourSchema.index({ startLocation: '2dsphere'});

tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', // {foregin key for Review which ref to Tour}
  localField: '_id'
});

// PRE MIDDLEWARE

tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});


// QUERY MIDDLEWARE:

tourSchema.pre(/^find/, function (next) {
  // >> to avoid that ^ we use this
  this.find({ secretTour: { $ne: true } });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({  //Populate helps for embbeding data from tours with id
    path: 'guides',
    select: '-__v -passwordChangedAt'       // remove select entities from result at postman
  });
  next();
});

tourSchema.post(/^find/, function (doc, next) {
  // console.log(doc);
  next();
});


//  AGGREGATION MIDDLEWARE

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
