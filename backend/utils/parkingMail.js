const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD,
    },
});

class parkingMail {
    static async sendGatePassEmail(userEmail, bookingDetails) {
        try {
            const { vehicleNumber, selectedSlot, selectedDate, bookingDuration, price } = bookingDetails;
            const logoUrl = "https://i.ibb.co/1Kp8CXg/6th-gear-Logo.png";
            
            const mailOptions = {
                from: `"Sixth Gear Parking" <${process.env.GMAIL_EMAIL}>`,
                to: userEmail,
                subject: `🎫 Your Parking Gate Pass - ${new Date(selectedDate).toLocaleDateString()}`,
                html: `
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                        <div style="background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                            <!-- Header Section -->
                            <div style="text-align: center; margin-bottom: 30px;">
                                <img src="${logoUrl}" alt="Sixth Gear Logo" style="max-width: 180px; margin-bottom: 20px;">
                                <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #3498db, #2980b9); margin: 20px auto;"></div>
                            </div>

                            <!-- Main Title -->
                            <div style="background: linear-gradient(90deg, #3498db, #2980b9); padding: 20px; border-radius: 12px; margin-bottom: 30px;">
                                <h1 style="color: #ffffff; text-align: center; font-size: 32px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">
                                    Parking Gate Pass
                                </h1>
                            </div>

                            <!-- Welcome Message -->
                            <div style="text-align: center; margin-bottom: 30px;">
                                <p style="font-size: 18px; color: #444; line-height: 1.6;">
                                    Welcome to Sixth Gear Hotel Parking
                                </p>
                                <p style="font-size: 16px; color: #666; line-height: 1.6;">
                                    Your parking reservation has been confirmed. Please find your booking details below.
                                </p>
                            </div>

                            <!-- Booking Details Card -->
                            <div style="background-color: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 2px dashed #e0e0e0;">
                                <div style="text-align: center;">
                                    <h2 style="color: #2c3e50; font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                                        Booking Details
                                    </h2>
                                    
                                    <!-- Details Grid -->
                                    <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
                                        <div style="padding: 10px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                            <strong style="color: #3498db;">Vehicle Number</strong>
                                            <div style="font-size: 18px; color: #333; margin-top: 5px;">${vehicleNumber}</div>
                                        </div>
                                        
                                        <div style="padding: 10px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                            <strong style="color: #3498db;">Slot Number</strong>
                                            <div style="font-size: 18px; color: #333; margin-top: 5px;">${selectedSlot}</div>
                                        </div>
                                        
                                        <div style="padding: 10px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                            <strong style="color: #3498db;">Date</strong>
                                            <div style="font-size: 18px; color: #333; margin-top: 5px;">
                                                ${new Date(selectedDate).toLocaleDateString('en-US', { 
                                                    weekday: 'long', 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                })}
                                            </div>
                                        </div>
                                        
                                        <div style="padding: 10px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                            <strong style="color: #3498db;">Duration</strong>
                                            <div style="font-size: 18px; color: #333; margin-top: 5px;">${bookingDuration}</div>
                                        </div>
                                    </div>

                                    <!-- Price Section -->
                                    <div style="margin-top: 20px; padding: 15px; background: linear-gradient(90deg, #3498db, #2980b9); border-radius: 8px; color: white;">
                                        <strong style="font-size: 20px;">Total Amount</strong>
                                        <div style="font-size: 24px; font-weight: bold; margin-top: 5px;">LKR ${price}</div>
                                    </div>
                                </div>
                            </div>

                            <!-- QR Code Placeholder -->
                            <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 12px;">
                                <div style="font-size: 16px; color: #666;">
                                    <strong>📱 Show this email at the entrance</strong>
                                </div>
                            </div>

                            <!-- Footer -->
                            <div style="text-align: center; margin-top: 30px; padding-top: 30px; border-top: 1px solid #eee;">
                                <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
                                    Thank you for choosing Sixth Gear Hotel Parking
                                </p>
                                <div style="font-size: 14px; color: #888;">
                                    <p>Need assistance? Contact us at:</p>
                                    <p>📞 +94 XX XXX XXXX | 📧 support@sixthgear.com</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `
            };

            const info = await transporter.sendMail(mailOptions);
            console.log("Gate pass email sent: ", info.response);
        } catch (error) {
            console.error("Failed to send gate pass email:", error);
        }
    }
}

module.exports = parkingMail;