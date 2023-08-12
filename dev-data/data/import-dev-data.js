const dotenv = require("dotenv");
const mongoose = require("mongoose");
const fs = require('fs');
const Tour = require('./../../models/tourModel');
const Review = require("./../../models/reviewModel");
const User = require('./../../models/userModel');

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE;

mongoose
// .connect(process.env.DATABASE_LOCAL , {  -- >>>>> (for local host)
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((con) => {
    // console.log(con.connections);
    console.log("DB connection sucessful !");
  });

// READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json` , 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json` , 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json` , 'utf-8'));

//IMPORT DATA INTO DB
const importData = async() => {
    try{
        await Tour.create(tours);
        await User.create(users , { validateBeforeSave: false });
        await Review.create(reviews);

        console.log('data sucessfully loaded !');
    } catch(err) {
        console.log(err);
    }
    process.exit();
}

//DELETE ALL DATA FROM DB
const deleteData = async() => {
    try{
        await Tour.deleteMany();
        await Review.deleteMany();
        await User.deleteMany();
        console.log('data sucessfully deleted !');
        process.exit();
    } catch(err) {
        console.log(err);
    }
}

if(process.argv[2] == '--import'){
    importData()
} else if(process.argv[2] == '--delete'){
    deleteData();
}

console.log(process.argv);