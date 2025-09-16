// functions/index.js
import { onCall } from "firebase-functions/v2/https";
import * as nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "eliteautohaus.helpdesk@gmail.com",
    pass: "YOUR_APP_PASSWORD" // ⚠️ Gmail App Password
  }
});

export const sendConfirmationMail = onCall(async (request) => {
  const { email, carName, carPrice, address } = request.data;

  const mailOptions = {
    from: '"Élite AutoHaus" <eliteautohaus.helpdesk@gmail.com>',
    to: email,
    subject: `Purchase Confirmation - ${carName}`,
    html: `
      <h2>Thanks for your purchase!</h2>
      <p><b>Car:</b> ${carName}</p>
      <p><b>Price:</b> ₹${carPrice}</p>
      <p><b>Delivery Address:</b> ${address}</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (err) {
    console.error("Email failed:", err);
    throw new Error("Failed to send confirmation email");
  }
});
