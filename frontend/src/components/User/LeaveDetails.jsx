import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, message, DatePicker } from "antd";
import moment from "moment";

const LeaveDetails = () => {
    // State to store the list of leave records
    const [leaves, setLeaves] = useState([]);
    // State to manage the loading state while fetching data
    const [loading, setLoading] = useState(true);
    // State to control the visibility of the leave request modal
    const [isModalVisible, setIsModalVisible] = useState(false);
    // State to store the selected 'from' date for a leave request
    const [fromDate, setFromDate] = useState(null);
    // State to store the selected 'to' date for a leave request
    const [toDate, setToDate] = useState(null);
    // Retrieve the current user information from localStorage
    const user = JSON.parse(localStorage.getItem("currentUser"));
    // Extract the employee ID from the user object
    const empID = user.userID;

    // Effect to fetch leave records when the component mounts
    useEffect(() => {
        fetchLeaves();
    }, []);

    // Function to fetch leave records from the server
    const fetchLeaves = async () => {
        try {
            const response = await axios.get(
                `http://localhost:5000/api/employee/getLeave/${empID}`
            );
            // Set the retrieved leave records in the state
            setLeaves(response.data.leaves);
        } catch (error) {
            message.error("Failed to retrieve leaves");
        } finally {
            // Set loading to false once the data fetching is done
            setLoading(false);
        }
    };

    // Function to handle adding a new leave request
    const handleAddLeave = async () => {
        if (!fromDate || !toDate) {
            message.error("Please select both From Date and To Date");
            return;
        }

        // Convert the dates to 'YYYY-MM-DD' format using moment
        const formattedFromDate = moment(fromDate).format('YYYY-MM-DD');
        const formattedToDate = moment(toDate).format('YYYY-MM-DD');

        try {
            // Send the leave request to the server
            const response = await axios.post(
                "http://localhost:5000/api/employee/addLeave",
                {
                    empID,
                    fromDate: formattedFromDate,
                    toDate: formattedToDate,
                }
            );
            // Update the leave records with the new data from the response
            setLeaves(response.data.leaves);
            message.success("Leave added successfully");
            closeModal(); // Close the modal after successful submission
        } catch (error) {
            message.error("Failed to add leave");
        }
    };

    // Function to open the leave request modal
    const openModal = () => {
        setIsModalVisible(true);
    };

    // Function to close the leave request modal and reset the date fields
    const closeModal = () => {
        setIsModalVisible(false);
        setFromDate(null);
        setToDate(null);
    };

    // Define the columns for the leaves table
    const columns = [
        { title: "Leave ID", dataIndex: "leaveID", key: "leaveID" },
        { title: "From Date", dataIndex: "fromDate", key: "fromDate" },
        { title: "To Date", dataIndex: "toDate", key: "toDate" },
        { title: "Status", dataIndex: "status", key: "status" },
    ];

    return (
        <div id="leave-request-container-1234">
            <div className="leave-header-container-1234">
                <h1>Leave Details</h1>
                <button id="custom-add-button-1234" onClick={openModal}>
                    Add
                </button>
            </div>

            {/* Conditionally render the leave request modal */}
            {isModalVisible && (
                <div id="custom-modal-1234">
                    <div id="custom-modal-content-1234">
                        <h2>Request Leave</h2>
                        <div className="custom-model-date-container-1234">
                            <DatePicker
                                placeholder="From Date"
                                onChange={(date, dateString) =>
                                    setFromDate(dateString)
                                }
                            />
                            <DatePicker
                                placeholder="To Date"
                                onChange={(date, dateString) =>
                                    setToDate(dateString)
                                }
                            />
                        </div>
                        <div id="custom-modal-actions-1234">
                            <button
                                id="custom-modal-button-submit-1234"
                                onClick={handleAddLeave}
                            >
                                Submit
                            </button>
                            <button
                                id="custom-modal-button-cancel-1234"
                                onClick={closeModal}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Conditionally render based on loading state and leave data availability */}
            {loading ? (
                <div className="center">
                    <p>Loading...</p>
                </div>
            ) : leaves.length === 0 ? (
                <div className="center">
                    <p>No any leaves found. Click "add" button to request</p>
                </div>
            ) : (
                <Table
                    dataSource={leaves}
                    columns={columns}
                    rowKey="_id"
                    pagination={false}
                />
            )}
        </div>
    );
};

export default LeaveDetails;
