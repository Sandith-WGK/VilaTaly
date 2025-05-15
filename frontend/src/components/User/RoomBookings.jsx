import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Input, DatePicker, message } from "antd";
import moment from 'moment'; // Import moment for date formatting

function RoomBookings() {
    const [bookings, setBookings] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [form] = Form.useForm();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 2;

    // Fetch bookings data
    const getBookings = async () => {
        try {
            const response = await axios.get("/api/room/getBookings");
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            const filteredBookings = response.data.bookings.filter(
                (booking) => booking.userID === currentUser.userID
            );
            setBookings(filteredBookings);
        } catch (error) {
            console.log(error);
        }
    };

    // Delete booking function
    const deleteBooking = async (bookingId) => {
        try {
            await axios.delete(`/api/room/deleteBooking/${bookingId}`);
            message.success("Booking deleted successfully");
            getBookings(); // Refresh bookings after deletion
        } catch (error) {
            console.log(error);
            message.error("Failed to delete booking");
        }
    };

    // Handle edit button click
    const handleEdit = (booking) => {
        setSelectedBooking(booking);
        setIsEditModalOpen(true);
        form.setFieldsValue({
            guestName: booking.guestName,
            checkInDate: moment(booking.checkInDate), // Set moment date
            checkOutDate: moment(booking.checkOutDate), // Set moment date
        });
    };

    // Handle modal cancel
    const handleCancel = () => {
        setIsEditModalOpen(false);
    };

    // Handle form submission for editing booking
    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            await axios.put(`/api/room/updateBooking/${selectedBooking._id}`, {
                guestName: values.guestName,
                checkInDate: values.checkInDate.format('YYYY-MM-DD'), // Format date
                checkOutDate: values.checkOutDate.format('YYYY-MM-DD'), // Format date
            });
            message.success("Booking updated successfully");
            setIsEditModalOpen(false);
            getBookings(); // Refresh bookings after update
        } catch (error) {
            console.log(error);
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
        <div className="bookings-container">
            <h2>Your Room Bookings</h2>
            {bookings.length === 0 ? (
                <p>No bookings found</p>
            ) : (
                <>
                    <div className="booking-cards">
                        {currentBookings.map((booking) => (
                            <div key={booking._id} className="booking-card">
                                <h3>Booking ID: {booking.bookingID}</h3>
                                <p>Room Number: {booking.roomNumber}</p>                              
                                <p>Guest Name: {booking.guestName}</p>
                                <p>Packages: {booking.packages.join(" , ")}</p>
                                <p>Check-in: {moment(booking.checkInDate).format('YYYY-MM-DD')}</p> {/* Format date */}
                                <p>Check-out: {moment(booking.checkOutDate).format('YYYY-MM-DD')}</p> {/* Format date */}
                                <h5>Total Amount: Rs {booking.totalAmount}</h5>
                                <div className="card-buttons">
                                    <Button type="primary" onClick={() => handleEdit(booking)}>Edit</Button>
                                    <Button type="danger" onClick={() => deleteBooking(booking._id)}>Cancel</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="pagination">
                        <Button
                            type="default"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <span>Page {currentPage}</span>
                        <Button
                            type="default"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={indexOfLastBooking >= bookings.length}
                        >
                            Next
                        </Button>
                    </div>
                </>
            )}

            {/* Edit Booking Modal */}
            <Modal
                title="Edit Booking"
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

export default RoomBookings;
