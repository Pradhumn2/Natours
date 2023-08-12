module.exports = fn => {
    return (req, res, next) => {
      fn(req, res, next).catch(next); // next-> directly send this error to global error handler
    };
  };