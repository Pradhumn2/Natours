class AppError extends Error{
    constructor(message , statusCode){
        super(message);   // To call parent constructor(extends from) i.e, Error ,
                          // so it aquire properties of Error class including message.

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;  // (error type)

        Error.captureStackTrace(this , this.constructor);
    }
}

module.exports = AppError;