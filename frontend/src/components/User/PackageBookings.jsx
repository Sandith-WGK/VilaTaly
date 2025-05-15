import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Input, DatePicker, message } from "antd";
import moment from "moment";

function PackageBookings() {
  const [bookings, setBookings] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;

  // Fetch package bookings data
  const getBookings = async () => {
    try {
      const response = await axios.get("/api/booking/getBookings");
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (!currentUser || !currentUser._id) {
        message.error("User not logged in");
        return;
      }
      const filteredBookings = response.data.bookings.filter(
        (booking) => booking.guestId === currentUser._id
      );
      console.log("Filtered bookings:", filteredBookings); // Debug
      setBookings(filteredBookings);
    } catch (error) {
      console.error("Error fetching package bookings:", error);
      message.error("Failed to load bookings");
    }
  };

  // Delete booking function
  const deleteBooking = async (bookingId) => {
    try {
      await axios.delete(`/api/booking/deleteBooking/${bookingId}`);
      message.success("Booking canceled successfully");
      getBookings();
    } catch (error) {
      console.error("Error deleting booking:", error);
      message.error("Failed to cancel booking");
    }
  };

  // Handle edit button click
  const handleEdit = (booking) => {
    setSelectedBooking(booking);
    setIsEditModalOpen(true);
    form.setFieldsValue({
      guestName: booking.guestName,
      checkInDate: moment(booking.checkInDate),
      checkOutDate: moment(booking.checkOutDate),
    });
  };

  // Handle modal cancel
  const handleCancel = () => {
    setIsEditModalOpen(false);
    form.resetFields();
  };

  // Handle form submission for editing booking
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const updatedBooking = {
        guestName: values.guestName,
        checkInDate: values.checkInDate.format("YYYY-MM-DD"),
        checkOutDate: values.checkOutDate.format("YYYY-MM-DD"),
      };
      await axios.put(`/api/booking/updateBooking/${selectedBooking._id}`, updatedBooking);
      message.success("Booking updated successfully");
      setIsEditModalOpen(false);
      getBookings();
    } catch (error) {
      console.error("Error updating booking:", error);
      message.error("Failed to update booking");
    }
  };

  // Pagination
  const indexOfLastBooking = currentPage * itemsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - itemsPerPage;
  const currentBookings = bookings.slice(indexOfFirstBooking, indexOfLastBooking);

  // Change page
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Fetch bookings when the component mounts
  useEffect(() => {
    getBookings();
  }, []);

  return (
    <div className="bookings-container" style={{ padding: "20px" }}>
      <h2>Your Package Bookings</h2>
      {bookings.length === 0 ? (
        <p>No package bookings found</p>
      ) : (
        <>
          <div className="booking-cards" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {currentBookings.map((booking) => (
              <div
                key={booking._id}
                className="booking-card"
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "15px",
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                <h3>Booking ID: {booking.bookingID || "N/A"}</h3>
                <p>Package: {booking.package?.name || "Unknown"}</p>
                <p>Guest Name: {booking.guestName || "N/A"}</p>
                <p>Check-in: {moment(booking.checkInDate).format("YYYY-MM-DD")}</p>
                <p>Check-out: {moment(booking.checkOutDate).format("YYYY-MM-DD")}</p>
                <h5>
                  Total Amount: $
                  {typeof booking.totalAmount === "number" ? booking.totalAmount.toFixed(2) : "N/A"}
                </h5>
                <div className="card-buttons" style={{ marginTop: "10px" }}>
                  <Button type="primary" onClick={() => handleEdit(booking)}>
                    Edit
                  </Button>
                  <Button
                    type="danger"
                    onClick={() => deleteBooking(booking._id)}
                    style={{ marginLeft: "10px" }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="pagination" style={{ marginTop: "20px", textAlign: "center" }}>
            <Button
              type="default"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{ marginRight: "10px" }}
            >
              Previous
            </Button>
            <span>Page {currentPage}</span>
            <Button
              type="default"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={indexOfLastBooking >= bookings.length}
              style={{ marginLeft: "10px" }}
            >
              Next
            </Button>
          </div>
        </>
      )}

      {/* Edit Booking Modal */}
      <Modal
        title="Edit Package Booking"
        open={isEditModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Update"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Guest Name"
            name="guestName"
            rules={[{ required: true, message: "Please enter guest name" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Check-in Date"
            name="checkInDate"
            rules={[{ required: true, message: "Please select check-in date" }]}
          >
            <DatePicker format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item
            label="Check-out Date"
            name="checkOutDate"
            rules={[{ required: true, message: "Please select check-out date" }]}
          >
            <DatePicker format="YYYY-MM-DD" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default PackageBookings;