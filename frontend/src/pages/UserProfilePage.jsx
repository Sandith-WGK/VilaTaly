import React, { useState, useEffect } from "react";
import axios from "axios";
import { message, Tabs, ConfigProvider } from "antd"; // Import Antd message component
//import RoomBookings from "../components/User/RoomBookings";
import EventBookings from "../components/User/EventBookings";
//import FoodOrders from "../components/User/FoodOrders";
//import ParkingBookings from "../components/User/ParkingBookings";
import LeaveDetails from "../components/User/LeaveDetails";
import Feedbacks from "../components/User/Feedbacks";
//import Packages from "../components/User/PackageBooking";

function UserProfilePage() {
  const [user, setUser] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState("1");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
  });

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (currentUser) {
      setUser(currentUser);
      setFormData({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        username: currentUser.username,
      });
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

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

      message.success("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update user", error);
      message.error("Failed to update profile. Please try again.");
    }
  };

  return (
    <div className="user-profile-page-1234">
      <div className="profile-card-1234">
        <div className="profile-header-1234">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Windows_10_Default_Profile_Picture.svg/1200px-Windows_10_Default_Profile_Picture.svg.png"
            alt="Profile"
          />
          <div className="profile-info-1234">
            <h3>
              {user.firstName} {user.lastName}
            </h3>
            <p>{user.userType}</p>
          </div>
        </div>

        {/* Show profile details only if not editing OR user is not Employee */}
        {!isEditing && user.userType !== "Employee" && (
          <div className="profile-details-1234">
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Username:</strong> {user.username}
            </p>
          </div>
        )}

        <button className="edit-button-1234" onClick={handleEdit}>
          Edit Profile
        </button>

        <p></p>

   
      </div>

      {/* Show edit form only if user is an Employee and isEditing */}
      {isEditing && user.userType === "Customer" ? (
        <div className="edit-modal-1234">
          <div className="modal-content-1234">
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
            <div className="modal-buttons-1234">
              <button className="save-button-1234" onClick={handleSave}>
                Save
              </button>
              <button
                className="cancel-button-1234"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Show additional features only if not an employee OR not editing
        user.userType !== "Employee" && (
          <div className="additional-features-container-1234">
            <ConfigProvider theme={{ token: { colorPrimary: "#27ae61" } }}>
              <Tabs
                defaultActiveKey="1"
                onChange={setActiveTabKey}
                activeKey={activeTabKey}
              >
                <Tabs.TabPane tab="Bookings" key="1">
                  <EventBookings />
                </Tabs.TabPane>

                <Tabs.TabPane tab="Feedbacks" key="2">
                  <Feedbacks />
                </Tabs.TabPane>
                {user.userType === "Employee" && (
                  <Tabs.TabPane tab="Leaves" key="3">
                    <LeaveDetails />
                  </Tabs.TabPane>
                )}
              </Tabs>
            </ConfigProvider>
          </div>
        )
      )}
    </div>
  );
}

export default UserProfilePage;
