const AppError = require("../utils/appError");

const handleCastErrorDB = err => {
  // console.log('handlecast...   run');
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message , 400);
}
const sendErrorDev = (err , res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err , res) => {
  // Operational , Trusted errors: Send message to clients
  if(err.isOperational){
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  else{
    // Programming or other unknown error : don't leak error details

    // 1)log error
    // console.error('Error' , err);

    // 2) send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
}

const handleJWTExpiredError = () => new AppError('Your token is expired! Please login again' , 401);

const handleJWTError = () => new AppError('Invalid token! Please Login again' , 401);

module.exports = (err, req, res, next) => {
  // Globally declared middleware to handle all errors
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if(process.env.NODE_ENV === 'development'){
    // console.log('development runs');
    sendErrorDev(err , res);
  }
  else if(process.env.NODE_ENV === 'production'){
    
    let error = Object.assign(err);
    if(error.name === 'CastError') error = handleCastErrorDB(error);  
    if(error.name === 'JsonWebTokenError') error = handleJWTError();
    if(error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    // console.log(error.name);

    sendErrorProd(error , res);
  }

};
