import { onCall } from "firebase-functions/v2/https";
import * as nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "eliteautohaus.helpdesk@gmail.com",
    pass: "lnipamdhygpsgkao"  // ⚠️ Gmail App Password
  }
});

// Use onCall (works with httpsCallable)
export const sendConfirmationMail = onCall(async (request) => {
  const { email, carName, carPrice, address } = request.data;

  const mailOptions = {
    from: "eliteautohaus.helpdesk@gmail.com",
    to: email,
    subject: "Your Car Purchase Confirmation 🚗",
    text: `Thank you for booking ${carName}.\n\nPrice: ₹${carPrice.toLocaleString()}\nDelivery Address: ${address}\n\nWe’ll contact you soon.`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send confirmation email.");
  }
});
