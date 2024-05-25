import nodemailer from "nodemailer";


// async..await is not allowed in global scope, must use a wrapper
const sendEmail = async function (email, subject, message) {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service: "gmail",
    host: process.env.SMTP_HOST ,
    port: 587,
    secure: true, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: process.env.SMTP_USERNAME,
      pass:  process.env.SMTP_PASSWORD,
    },
  });

  // send mail with defined transport object
  await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL, // sender address
    to: 'utkarshchaturvedi890@gmail.com', // list of receivers
    //to get the mail from user so use 'req.body.email'
    subject: "Subject of the gmail", // Subject line
    html: "<b>Hello me?</b>", // html body
  });
};
export { sendEmail };
