import { message } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";


function QRAttendance() {
  const [qrCode, setQrCode] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchEmployeeQRDetails();
  }, []);

  const fetchEmployeeQRDetails = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      console.log("Current User:", currentUser);

      if (currentUser) {
        const response = await axios.get(
          `http://localhost:5000/api/employee/getEmployeeQRCode/${currentUser.userID}`
        );
        const employeeData = response.data;
        console.log("Employee QR Data:", employeeData);

        setQrCode(employeeData.qrCode);
      }
    } catch (error) {
      console.error("Failed to fetch QR code:", error.message, error.stack);
      message.error("Failed to fetch QR code. Please try again.");
    }
  };

  const downloadQRCode = () => {
    if (!qrCode) {
      message.error("No QR code available to download.");
      return;
    }

    try {
      const link = document.createElement("a");
      link.href = qrCode;
      link.download = "qr-code.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success("QR code downloaded successfully.");
    } catch (error) {
      console.error("Failed to download QR code:", error.message, error.stack);
      message.error("Failed to download QR code. Please try again.");
    }
  };

  return (
    <div className="qr-attendance p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Your Attendance QR Code</h2>
          {qrCode ? (
            <div className="flex flex-col items-center">
              <img
                src={qrCode}
                alt="Attendance QR Code"
                className="w-32 h-32 mb-4"
              />
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={downloadQRCode}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                >
                  Download QR Code
                </button>
              </div>
              {copied && (
                <div className="text-center">
                  <p className="text-gray-600 mb-2">Copy QR code URL manually:</p>
                  <input
                    type="text"
                    value={qrCode}
                    readOnly
                    className="w-full p-2 border rounded-md text-sm text-gray-600"
                    onClick={(e) => e.target.select()}
                  />
                  <p className="text-gray-500 text-sm mt-2">
                    Select and copy the URL above or use the downloaded QR code.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center">No QR code available</p>
          )}
          <p className="text-gray-600 text-center mt-4">
            Show this QR code to mark your attendance.
          </p>
        </div>
      </div>
    </div>
  );
}

export default QRAttendance;