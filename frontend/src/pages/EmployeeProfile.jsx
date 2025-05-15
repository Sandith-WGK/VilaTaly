import { ConfigProvider, message, Tabs } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import EventBookings from "../components/User/EventBookings";
import Feedbacks from "../components/User/Feedbacks";
import FoodOrders from "../components/User/FoodOrders";
import LeaveDetails from "../components/User/LeaveDetails";
import Packages from "../components/User/PackageBooking";
import ParkingBookings from "../components/User/ParkingBookings";
import QRAttendance from "../components/User/QRAttendance";

function UserProfilePage() {
    const [user, setUser] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [activeTabKey, setActiveTabKey] = useState("1");
    const [userImage, setUserImage] = useState(null);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        username: "",
    });

    // Default fallback image
    const fallbackImage = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Windows_10_Default_Profile_Picture.svg/1200px-Windows_10_Default_Profile_Picture.svg.png";

    // Fetch employee details when the component mounts
    useEffect(() => {
        fetchEmployeeDetails();
        fetchUserData();
    }, []);

    // Fetch employee details from the backend
    const fetchEmployeeDetails = async () => {
        try {
            const currentUser = JSON.parse(localStorage.getItem("currentUser"));
            console.log("Current User:", currentUser); // Log the current user

            if (currentUser) {
                const response = await axios.get(
                    `http://localhost:5000/api/employee/getEmployee/${currentUser.userID}` // Use userID
                );
                const employeeData = response.data;
                console.log("Employee Data:", employeeData); // Log the fetched employee data

                setUser(employeeData);
                setFormData({
                    firstName: employeeData.firstName,
                    lastName: employeeData.lastName,
                    email: employeeData.email,
                    username: employeeData.username,
                });
            }
        } catch (error) {
            console.error("Failed to fetch employee details", error);
            message.error("Failed to fetch employee details. Please try again.");
        }
    };

    // Handle saving updated employee details
    const handleSave = async () => {
        try {
            const response = await axios.put(
                "http://localhost:5000/api/user/updateUser",
                {
                    userID: user.userID,
                    ...formData,
                }
            );

            const updatedUser = response.data.user;
            localStorage.setItem("currentUser", JSON.stringify(updatedUser));
            setUser(updatedUser);
            setIsEditing(false);

            // Show success message
            message.success("Profile updated successfully");
        } catch (error) {
            console.error("Failed to update user", error);

            // Show error message
            message.error("Failed to update profile. Please try again.");
        }
    };

    // Handle tab change
    const onTabChange = (key) => {
        setActiveTabKey(key);
    };

    // Handle input changes in the form
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    // Enable editing mode
    const handleEdit = () => {
        setIsEditing(true);
    };

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const fetchUserData = async () => {
        try {
            const currentUser = JSON.parse(localStorage.getItem("currentUser"));
            console.log("Current User:", currentUser);

            if (currentUser) {
                const response = await axios.get(
                    `http://localhost:5000/api/employee/getEmployeeQRCode/${currentUser.userID}`
                );
                const employeeData = response.data;
                console.log("Employee QR Data:", employeeData);
                setUserImage(employeeData);
                setFormData({
                    imageUrl: employeeData.imageUrl,
                });
            }
        } catch (error) {
            console.error("Failed to fetch QR code:", error.message, error.stack);
            message.error("Failed to fetch QR code. Please try again.");
        }
    };

    return (
        <div className={`user-profile-page-1234`}>
            <div className={`profile-card-1234`}>
                <div className={`profile-header-1234`}>
                    {console.log("User Image URL:", userImage?.imageUrl)} {/* Log the image URL */}
                    <img
                        src={
                            userImage?.imageUrl && userImage.imageUrl.startsWith("data:image/")
                                ? userImage.imageUrl
                                : fallbackImage
                        }
                        alt="Profile"
                        style={{
                            width: "100px",
                            height: "100px",
                            borderRadius: "50%",
                            objectFit: "cover",
                        }}
                        onError={(e) => {
                            console.error("Failed to load profile image:", userImage?.imageUrl);
                            e.target.src = fallbackImage; // Fallback on error
                        }}
                    />
                    <div className={`profile-info-1234`}>
                        <h3>
                            {user.firstName} {user.lastName}
                        </h3>
                        <p>{user.userType}</p>
                    </div>
                </div>
                <div className={`profile-details-1234`}>
                    <p>
                        <strong>Email:</strong>{" "}
                        {validateEmail(user.email) ? user.email : "invalid email"}
                    </p>
                    <p>
                        <strong>Username:</strong> {user.username}
                    </p>
                </div>
                {/* Optional: Display QR Code */}
                {/* <div className="qr-code-1234">
                    <img
                        src={user.qrCode && user.qrCode.startsWith("data:image/") ? user.qrCode : fallbackImage}
                        alt="QR Code"
                        style={{
                            width: "100px",
                            height: "100px",
                            marginTop: "10px",
                        }}
                        onError={(e) => {
                            console.error("Failed to load QR code:", user.qrCode);
                            e.target.src = fallbackImage; // Fallback on error
                        }}
                    />
                    <p><strong>QR Code</strong></p>
                </div> */}
                <button className={`edit-button-1234`} onClick={handleEdit}>
                    Edit Profile
                </button>
            </div>
            <div className="additional-features-container-1234">
                <ConfigProvider
                    theme={{
                        token: {
                            colorPrimary: "#27ae61", // Set your desired primary color
                        },
                    }}
                >
                    <Tabs
                        defaultActiveKey="1"
                        onChange={onTabChange}
                        activeKey={activeTabKey} // Bind active tab key
                    >
                        <Tabs.TabPane tab="Attendance" key="1">
                            <QRAttendance />
                        </Tabs.TabPane>
                        <Tabs.TabPane tab="Events" key="2">
                            <EventBookings />
                        </Tabs.TabPane>
                        <Tabs.TabPane tab="Foods" key="3">
                            <FoodOrders />
                        </Tabs.TabPane>
                        <Tabs.TabPane tab="Parkings" key="4">
                            <ParkingBookings />
                        </Tabs.TabPane>
                        <Tabs.TabPane tab="Feedbacks" key="5">
                            <Feedbacks />
                        </Tabs.TabPane>
                        {user.userType === "Employee" && (
                            <Tabs.TabPane tab="Leaves" key="6">
                                <LeaveDetails />
                            </Tabs.TabPane>
                        )}
                        <Tabs.TabPane tab="Packages" key="7">
                            <Packages />
                        </Tabs.TabPane>
                    </Tabs>
                </ConfigProvider>
            </div>

            {isEditing && (
                <div className={`edit-modal-1234`}>
                    <div className={`modal-content-1234`}>
                        <h3>Edit Profile</h3>
                        <label>
                            First Name:
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                required
                            />
                        </label>
                        <label>
                            Last Name:
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                required
                            />
                        </label>
                        <label>
                            Email:
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                disabled
                            />
                        </label>
                        <label>
                            Username:
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                disabled
                            />
                        </label>
                        <div className={`modal-buttons-1234`}>
                            <button
                                className={`save-button-1234`}
                                onClick={handleSave}
                            >
                                Save
                            </button>
                            <button
                                className={`cancel-button-1234`}
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserProfilePage;