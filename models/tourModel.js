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

//Indexing is use to sort the result as per required query, 
//to avoid unnessacery scanning obj. while executing query
//"USE ONLY FOR FREQUENTLY USED QUERIES BY USERS , COZ IT INCREASES TIME"
tourSchema.index({price: 1, ratingsAverage: -1 , slug: -1});   //1: ascending order, -1: desending order

tourSchema.index({tour: 1, user: 1} , {unique: true});   //For allowing only unique review of any tour by a particulat user.

tourSchema.index({ startLocation: '2dsphere'});  // startLocation should be a indexed to a 2dsphere(for real coordinates , like on earth)

tourSchema.virtual("durationWeeks").get(function () {
  //>> not a part of db
  return this.duration / 7;
});

//Virtual Populate (To show reviews in particular tour, we couldn't do normal embedding
//cuz tour to review is P->C referencing and we can't access parent(tour) in reviews)
//            {name of virtual entity}
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', // {foregin key for Review which ref to Tour}
  localField: '_id'
});

// PRE MIDDLEWARE: runs before save and .create() command but not .insertMany()

tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// To embedded data of guides of given id's to our guides array (But we're not gonna use it)
// tourSchema.pre("save" , async function(next) {
//   const guidesPromises = this.guides.map(async id => await User.findById(id));  // guidePromises store array of promises
//   this.guides = await Promise.all(guidesPromises);
//   console.log(this.guides);
//   next();
// })

// tourSchema.post("save", function (doc, next) {
//   // .> doc ->document just saved to db
//   // console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE: run before or after a certain query performed

//tourSchema.pre('find' , function(next) {   // >> but if we req in get tour , we get it
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

// tourSchema.pre("aggregate", function (next) {
//   // console.log(this);
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
