const express = require("express");
const reviewController = require("../controllers/reviewController");
const authController = require("../controllers/authController");

const router = express.Router({ mergeParams: true }); // To access tourId from nested routes from tourRoutes we set mergeParams = true

//Both the req routes landed here ->
//POST /tour/124kne/reviews/  {nested Routes using tourRoutes}
//POST /reviews          {simple req}

// Similarly for GET
//GET /tour/124kne/reviews/  {nested Routes using tourRoutes}
//GET /reviews          {simple req}

router.use(authController.protect);

router
  .route("/")
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo("user"),
    reviewController.createReview
  );

router
  .route("/:id")
  .get(reviewController.getReview)
  .delete(authController.restrictTo('user' , 'admin') , reviewController.deleteReview)
  .patch(authController.restrictTo('user' , 'admin') , reviewController.updateReview);

module.exports = router;
