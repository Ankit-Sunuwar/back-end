const nodemailer = require("nodemailer");

const transporter = new nodemailer.createTransport({
  service: process.env.SMTP_SERVICE,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log("Email Server is not working...");
  } else {
    console.log(" Email Server is connected... ");
  }
});

const sendEmail = async ({ to, subject, htmlMessage }) => {
  const info = await transporter.sendMail({
    from: `"XYZ Hotel Management" <${process.env.SMTP_EMAIL}>`, // sender address
    to, // list of receivers
    subject, // Subject line
    html: htmlMessage, // html body
  });
  return info; // {messageId: "", ...}
};

module.exports = { sendEmail };
