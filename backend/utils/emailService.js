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

    // New method to send booking status change notifications
    static async sendBookingStatusNotification(booking, newStatus) {
        try {
            const logoUrl = "https://i.ibb.co/1Kp8CXg/6th-gear-Logo.png";
            
            // Status-specific content
            const statusConfig = {
                confirmed: {
                    subject: "Booking Confirmed - VilaTaly Hotel",
                    color: "#52c41a",
                    message: "Your booking has been confirmed! We're excited to welcome you to VilaTaly Hotel.",
                    actionText: "View Booking Details"
                },
                pending: {
                    subject: "Booking Pending - VilaTaly Hotel",
                    color: "#faad14",
                    message: "Your booking is currently pending. We'll review and confirm it shortly.",
                    actionText: "View Booking Details"
                },
                cancelled: {
                    subject: "Booking Cancelled - VilaTaly Hotel",
                    color: "#ff4d4f",
                    message: "Your booking has been cancelled. If you have any questions, please contact us.",
                    actionText: "Contact Support"
                }
            };

            const config = statusConfig[newStatus] || statusConfig.pending;

            const mailOptions = {
                from: `"VilaTaly Hotel" <${process.env.GMAIL_EMAIL}>`,
                to: booking.guestEmail,
                subject: config.subject,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px;">
                            
                            <!-- Logo Section -->
                            <div style="text-align: center; margin-bottom: 20px;">
                                <img src="${logoUrl}" alt="VilaTaly Hotel Logo" style="max-width: 150px;">
                            </div>

                            <!-- Status Header -->
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h2 style="color: #333333; font-size: 28px; margin-bottom: 10px;">Booking ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</h2>
                                <div style="display: inline-block; padding: 8px 16px; background-color: ${config.color}; color: white; border-radius: 20px; font-weight: bold;">
                                    ${newStatus.toUpperCase()}
                                </div>
                            </div>

                            <p style="font-size: 18px; color: #555555; line-height: 1.6; text-align: center;">
                                Dear ${booking.guestName},
                            </p>

                            <p style="font-size: 18px; color: #555555; line-height: 1.6; text-align: center;">
                                ${config.message}
                            </p>

                            <!-- Booking Details Section -->
                            <div style="background-color: #f7f7f7; padding: 20px; border-radius: 10px; margin-top: 30px;">
                                <h3 style="font-size: 22px; margin: 0 0 15px 0; color: #333; text-align: center;">Booking Details</h3>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 16px;">
                                    <div><strong>Booking ID:</strong> ${booking._id}</div>
                                    <div><strong>Package:</strong> ${booking.packageId ? booking.packageId.name : 'N/A'}</div>
                                    <div><strong>Check-in:</strong> ${new Date(booking.checkInDate).toLocaleDateString()}</div>
                                    <div><strong>Check-out:</strong> ${new Date(booking.checkOutDate).toLocaleDateString()}</div>
                                    <div><strong>Total Amount:</strong> $${booking.totalAmount.toFixed(2)}</div>
                                    <div><strong>Nights:</strong> ${Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24))}</div>
                                </div>
                            </div>

                            <!-- Contact Information -->
                            <div style="background-color: #e6f7ff; padding: 20px; border-radius: 10px; margin-top: 20px; text-align: center;">
                                <h4 style="margin: 0 0 10px 0; color: #1890ff;">Need Help?</h4>
                                <p style="margin: 0; font-size: 16px; color: #555;">
                                    Email: support@vilataly.com<br>
                                    Phone: +94 11 234 5678<br>
                                    Address: VilaTaly Hotel, Colombo, Sri Lanka
                                </p>
                            </div>

                            <p style="font-size: 16px; color: #888888; text-align: center; margin-top: 40px;">
                                Thank you for choosing VilaTaly Hotel!<br>
                                Best regards,<br>
                                The VilaTaly Team
                            </p>
                        </div>
                    </div>
                `
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('Booking status notification sent:', info.messageId);
            return true;
            
        } catch (error) {
            console.error('Error sending booking status notification:', error);
            return false;
        }
    }
}

module.exports = EmailService;
