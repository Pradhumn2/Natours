const express = require("express");
const app = express();
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const golbalErrorHandler = require("./controllers/errorController");
const AppError = require("./utils/appError");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes"); 

//GLOBAL MIDDLEWARE

//Set Security HTTP Header
app.use(helmet());

//Loggin development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); // Middleware use to show status and other parameters in terminal itself
}

//Body parser , reading data from body into req.body
app.use(express.json({ limit: "10kb" })); // Middleware use for post a req by using express

//DATA SANITIZATION
//1. D.S against NoSQL query injection.
//(eg: accessing all emails by just using {email: {"$gt": ""}}, now hacker only need to guess any matching password from our DB)
app.use(mongoSanitize());

//2. D.S against XSS
app.use(xss()); //(convert all js code or req hacker tries to i/p as query into simple html req)

//Prevernt HTTP Parameter Pollution(HPP) .....   // remove duplicate fileds name from req {i,e. API FEATURES}
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "difficulty",
      "price",
      "maxGroupSize",
    ],
  })
);

//Serving static files
app.use(express.static(`${__dirname}/public`));

//TEST Middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString;
  // console.log(req.headers);
  next();
});

//API LIMITING: Use to prevent any attack by hacker, by bruteforcally guessing password ,
// done by limiting the API requests
const limiter = rateLimit({
  max: 100, // Max number of req acceptable from same IP
  windowMs: 60 * 60 * 1000,
  message: "Too many req from this IP, pLease try again after sometime!",
});
app.use("/api", limiter); // apllied to all routes uses "/api"

//3. Routes (MOUNTING)

app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);

app.all("*", (req, res, next) => {
  // >> if req url not found in any of above routes, it means that
  // res.status(404).json({                     // it's an invalid url , so to handle it we define this middleware
  //   status:'fail',
  //   message:`Can't find ${req.originalUrl} in this server`
  // })
  // OR
  // const err = new Error(`Can't fing ${req.originalUrl} in this server`);
  // err.statusCode = 404;
  // err.status = 'fail'
  // next(err);   // if some err called in next(...) parameter, then it will skip all middlewares
  //              // in b/w directly call the err middleware.

  next(new AppError(`Can't find ${req.originalUrl} in this server`, 404));
});

app.use(golbalErrorHandler);

module.exports = app;
