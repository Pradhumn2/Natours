const express = require("express");
const tourController = require("../controllers/tourController");
const router = express.Router();
const authController = require("../controllers/authController");
const reviewRouter = require("../routes/reviewRoutes");

// Nested Routes { accessing reviews from tours}
//POST /tour/124kne/reviews/
//GET /tour/do37983/reviews/
//GET /tour/773ghfk/reviews/jd38yh392
router.use("/:tourId/reviews", reviewRouter);

// router.param('id' , tourController.checkID);
router.route("/tour-stats").get(tourController.getTourStats);
router
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "lead-guide", "guide"),
    tourController.getMonthyPlan
  );

router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(tourController.getToursWithin);
// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/-40,45/unit/mi

router.route("/distances/:latlng/unit/:unit").get(tourController.getDistances);

router
  .route("/")
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.createNewTour
  );

router
  .route("/:id")
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.updateTours
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.deleteTours
  );

module.exports = router;
