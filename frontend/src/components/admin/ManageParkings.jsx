import React, { useState, useEffect, useCallback } from "react";
import { Table, message, DatePicker, Modal, Button, Input } from "antd";
import moment from "moment";
import axios from "axios";
import { CSVLink } from "react-csv";

function ManageParkings() {
        // State to hold the list of bookings
        const [bookings, setBookings] = useState([]);
        // State to hold the booking currently being edited
        const [editingBooking, setEditingBooking] = useState(null);
        // State to control the visibility of the edit modal
        const [isModalVisible, setIsModalVisible] = useState(false);
        // State to control the visibility of the delete confirmation modal
        const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
        // State to store the ID of the parking spot selected for deletion
        const [selectedParkingId, setSelectedParkingId] = useState(null);
        // State to hold the vehicle number being edited or added
        const [vehicleNumber, setVehicleNumber] = useState("");
        // State to hold the booking date being edited or added
        const [bookingDate, setBookingDate] = useState(null);
        const [searchTerm, setSearchTerm] = useState("");
        const [filteredBookings, setFilteredBookings] = useState([]);

        // Fetches bookings when the user is loaded
        useEffect(() => {
                fetchBookings();
        }, []);

        // State to manage table pagination
        const [pagination, setPagination] = useState({
                pageSize: 6,
                current: 1,
                position: ["bottomCenter"],
        });

        // Handle changes to the table (e.g., pagination)
        const handleTableChange = (pagination, filters, sorter) => {
                setPagination(pagination);
        };

        // Apply search filter when searchTerm or bookings list changes
        useEffect(() => {
                let tempList = bookings; // Create a temporary list to store the filtered bookings

                // Filter bookings based on the search term
                if (searchTerm !== "") {
                        tempList = tempList.filter((item) =>
                                item.vehicleNumber
                                        .toLowerCase()
                                        .includes(searchTerm.toLowerCase())
                        );
                }

                setFilteredBookings(tempList); // Update the filtered list of bookings
        }, [searchTerm, bookings]);

        // Function to fetch the list of bookings from the server
        const fetchBookings = async () => {
                try {
                        const response = await axios.get(
                                "/api/parking/getAllParkings"
                        );
                        setBookings(response.data);
                } catch (error) {
                        message.error("Failed to fetch bookings.");
                }
        };

        // Opens the delete confirmation modal
        const showDeleteModal = (parkingId) => {
                setSelectedParkingId(parkingId);
                setIsDeleteModalVisible(true);
        };

        // Handles the deletion of a booking
        const handleDelete = async () => {
                try {
                        await axios.post("/api/parking/delete", {
                                parkingId: selectedParkingId,
                        });
                        message.success("Booking deleted successfully.");
                        fetchBookings(); // Refresh the bookings list after deletion
                        setIsDeleteModalVisible(false); // Close delete modal
                } catch (error) {
                        message.error("Failed to delete booking.");
                }
        };

        // Opens the edit modal and populates it with the selected booking's data
        const handleEdit = (record) => {
                setEditingBooking(record);
                setVehicleNumber(record.vehicleNumber);
                setBookingDate(moment(record.bookingDate, "YYYY-MM-DD"));
                setIsModalVisible(true);
        };

        // Handles the update of a booking
        const handleUpdate = async () => {
                try {
                        await axios.post("/api/parking/update", {
                                parkingId: editingBooking.parkingId,
                                vehicleNumber,
                                bookingDate: bookingDate.format("YYYY-MM-DD"),
                        });
                        message.success("Booking updated successfully.");
                        setIsModalVisible(false);
                        fetchBookings(); // Refresh the bookings list after update
                } catch (error) {
                        message.error("Failed to update booking.");
                }
        };

        // Updates the bookingDate state when the date picker value changes
        const handleDateChange = (date) => {
                setBookingDate(date);
        };

        // Define CSV headers
        const csvHeaders = [
                { label: "Vehicle Number", key: "vehicleNumber" },
                { label: "Price", key: "price" },
                { label: "Booking Date", key: "bookingDate" },
                { label: "Package Type", key: "packageType" },
                { label: "Parking ID", key: "parkingId" },
        ];

        // Columns configuration for the bookings table
        const columns = [
                {
                        title: "Vehicle Number",
                        dataIndex: "vehicleNumber",
                        key: "vehicleNumber",
                },
                {
                        title: "Price",
                        dataIndex: "price",
                        key: "price",
                },
                {
                        title: "Booking Date",
                        dataIndex: "bookingDate",
                        key: "bookingDate",
                },
                {
                        title: "Package Type",
                        dataIndex: "packageType",
                        key: "packageType",
                },
                {
                        title: "Parking ID",
                        dataIndex: "parkingId",
                        key: "parkingId",
                },
                {
                        title: "Actions",
                        key: "actions",
                        render: (text, record) => (
                                <div className="actions-container2345">
                                        <Button
                                                onClick={() =>
                                                        handleEdit(record)
                                                }
                                                className="edit-button2345"
                                        >
                                                Edit
                                        </Button>
                                        <Button
                                                onClick={() =>
                                                        showDeleteModal(
                                                                record.parkingId
                                                        )
                                                }
                                                className="delete-button2345"
                                        >
                                                Cancel
                                        </Button>
                                </div>
                        ),
                },
        ];

        return (
                <div className="admin-manage-parking-2313">
                        <div className="parking-table-header-container">
                                <h3>Parking Bookings</h3>
                                <input
                                        type="text"
                                        placeholder="Search"
                                        value={searchTerm}
                                        onChange={(e) =>
                                                setSearchTerm(e.target.value)
                                        }
                                        className="search-input-42424"
                                        disabled={
                                                isModalVisible ||
                                                isDeleteModalVisible
                                        } // Disable search input when any popup is open
                                />
                                <CSVLink
                                        data={filteredBookings} // Data to be exported
                                        headers={csvHeaders} // Headers for CSV
                                        filename={"parking-bookings.csv"} // File name for download
                                        className="download-link"
                                >
                                        <button
                                                style={{
                                                        backgroundColor:
                                                                "#e74c3c",
                                                        color: "white",
                                                        padding: "12px 24px",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        cursor: "pointer",
                                                        fontSize: "16px",
                                                        textAlign: "center",
                                                        display: "inline-block",
                                                        transition: "background-color 0.3s",
                                                }}
                                        >
                                                Download CSV
                                        </button>
                                </CSVLink>
                        </div>
                        <Table
                                columns={columns}
                                dataSource={filteredBookings}
                                rowKey="parkingId"
                                pagination={
                                        filteredBookings.length > 6
                                                ? pagination
                                                : false
                                } // Enable pagination if more than 10 employees
                                onChange={handleTableChange} // Handle table change (e.g., pagination)
                        />

                        <Modal
                                title="Edit Booking"
                                visible={isModalVisible}
                                onOk={handleUpdate}
                                onCancel={() => setIsModalVisible(false)}
                                okText="Update"
                                cancelText="Cancel"
                        >
                                <div
                                        style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "10px",
                                        }}
                                >
                                        <div>
                                                <label>Vehicle Number:</label>
                                                <Input
                                                        value={vehicleNumber}
                                                        onChange={(e) =>
                                                                setVehicleNumber(
                                                                        e.target
                                                                                .value
                                                                )
                                                        }
                                                />
                                        </div>
                                        <div className="date-picker-21313">
                                                <label>Booking Date:</label>
                                                <DatePicker
                                                        value={bookingDate}
                                                        onChange={
                                                                handleDateChange
                                                        }
                                                />
                                        </div>
                                        <hr />
                                        <div>
                                                <label>Parking ID:</label>
                                                <Input
                                                        value={
                                                                editingBooking?.parkingId
                                                        }
                                                        disabled
                                                />
                                        </div>
                                        <div>
                                                <label>Package Type:</label>
                                                <Input
                                                        value={
                                                                editingBooking?.packageType
                                                        }
                                                        disabled
                                                />
                                        </div>
                                        <div>
                                                <label>Price:</label>
                                                <Input
                                                        value={
                                                                editingBooking?.price
                                                        }
                                                        disabled
                                                />
                                        </div>
                                </div>
                        </Modal>

                        <Modal
                                title="Confirm Delete"
                                visible={isDeleteModalVisible}
                                onOk={handleDelete}
                                onCancel={() => setIsDeleteModalVisible(false)}
                                okText="Yes, Delete"
                                cancelText="Cancel"
                        >
                                <p>
                                        Are you sure you want to delete this
                                        booking?
                                </p>
                        </Modal>
                </div>
        );
}

export default ManageParkings;
