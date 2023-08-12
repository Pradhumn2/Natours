const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const router = express.Router();

// No need to loggedIn or authentication
router.post("/signup", authController.singup); // >> we only want to sent data of user, so post only
router.post("/login", authController.login); // only for post
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

// Authentication req. from now on routes, so in place of adding middleware to each of these routes
// we'll assign it in our router
router.use(authController.protect);

router.patch("/updateMyPassword", authController.updatePassword);
router.get("/me", userController.getMe, userController.getUser);
router.patch("/updateMe", userController.updateMe);
router.delete("/deleteMe", userController.deleteMe);


//Protected and restricted to admin only
router.use(authController.restrictTo("admin"));

router.route("/").get(userController.getAllUsers);
router
  .route("/:id")
  .get(userController.getUser)
  .delete(userController.deleteUser);

  
module.exports = router;
