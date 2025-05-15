const nodemailer = require('nodemailer');

// Email setup with Gmail configuration
let transporter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Use true for 465 port and SSL
    auth: {
        user: process.env.GMAIL_EMAIL,  // Email address from environment variable (.env)
        pass: process.env.GMAIL_PASSWORD,  // Gmail password or App Password (if 2FA is enabled)
    },
});

// EmailService class to handle sending emails
class EmailService {
    static async sendReminderEmail(userEmail, event) {
        try {
            // Format the event date for better readability in the email
            const eventDateFormatted = new Date(event.eventDate).toLocaleString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'
            });

            // Public URL to the logo image
            const logoUrl = "https://i.ibb.co/1Kp8CXg/6th-gear-Logo.png";

            // Set up email options with inline image using URL
            const mailOptions = {
                from: `"Event Reminder" <${process.env.GMAIL_EMAIL}>`, // Sender email (from your .env)
                to: userEmail, // Recipient email (user)
                subject: `Reminder: ${event.eventName} is Coming Up!`, // Custom subject line with event name
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px;">
                            
                            <!-- Logo Section -->
                            <div style="text-align: center; margin-bottom: 20px;">
                                <img src="${logoUrl}" alt="Sixth Gear Logo" style="max-width: 150px;">
                            </div>

                            <!-- Event Reminder Header -->
                            <h2 style="color: #333333; text-align: center; font-size: 28px; margin-bottom: 20px;">Event Reminder</h2>

                            <p style="font-size: 18px; color: #555555; line-height: 1.6; text-align: center;">
                                Hello,
                            </p>

                            <p style="font-size: 18px; color: #555555; line-height: 1.6; text-align: center;">
                                This is a friendly reminder that the event "<strong>${event.eventName}</strong>" is happening tomorrow! 
                                We are excited to have you with us for this wonderful event. 
                            </p>

                            <!-- Event Information Section -->
                            <div style="background-color: #f7f7f7; padding: 20px; border-radius: 10px; margin-top: 30px; text-align: center;">
                                <h3 style="font-size: 22px; margin: 0 0 10px 0; color: #333;">Event Details</h3>
                                <p style="font-size: 18px; margin: 0;">
                                    <strong>Event Name:</strong> ${event.eventName}<br>
                                    <strong>Location:</strong> Six TH Gear Hotel
                                </p>
                            </div>

                            <!-- Footer and Call to Action -->
                            <p style="font-size: 18px; color: #555555; margin-top: 30px; text-align: center;">
                                We hope you enjoy the event! If you have any questions, feel free to reach out to us. See you soon!
                            </p>

                            <!-- Button to View Event Details -->
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="${event.eventLink}" style="display: inline-block; padding: 15px 35px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 18px; font-weight: bold;">
                                    View Event Details
                                </a>
                            </div>

                            <p style="font-size: 16px; color: #888888; text-align: center; margin-top: 40px;">
                                Thank you,<br>
                                The Events Team at Six TH Gear Hotel
                            </p>
                        </div>
                    </div>
                `
            };
            // Send the email
            const info = await transporter.sendMail(mailOptions);
            
        } catch (error) {
            
        }
    }
}

module.exports = EmailService;
