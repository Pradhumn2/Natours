const nodemailer = require('nodemailer');
// By using Ethereal
const sendEmail = async options => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: 'lee35@ethereal.email',
            pass: 'PmcVUSrr1QcrfaCNef'
        }
    });

    const info = await transporter.sendMail({
        from: '"Pradhumn" <foo@example.com>',
        to: options.email, 
        subject: options.subject, // Subject line
        text: options.message, // plain text body
    });

    console.log(info);

  //   This doesn't work bcz of server issues with mailtrap

    // //1.Create a transporter(which actually send the emails)
    // const transporter = nodemailer.createTransport({
    //     host: process.env.EMAIL_HOST,
    //     port: process.env.EMAIL_PORT,
    //     auth:{
    //         user: process.env.EMAIL_USERNAME,
    //         pass: process.env.EMAIL_PASSWORD
    //     }
    // })
    // //2.Define the email option
    // const mailOptions = {
    //     from: "pradhumn <pradhumn@4.io>",
    //     to: options.email,
    //     subject: options.subject,
    //     text: options.message
        
    // }
    // // console.log("mailoptions" , mailOptions);
    // // console.log("transporter" , transporter);
    
    // //3.Actually send the email
    
    // // console.log(await transporter.sendMail(mailOptions));
    // await transporter.sendMail(mailOptions);
    // console.log("end");

};

module.exports = sendEmail;

