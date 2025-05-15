import React, { useState, useEffect } from "react";
import {
        Space,
        Table,
        Tag,
        Modal,
        Input,
        message,
        Form,
        Select,
        InputNumber,
        Card,
} from "antd";
import { Icon } from "@iconify/react";
import axios from "axios";
import {
        LineChart,
        Line,
        BarChart,
        Bar,
        XAxis,
        YAxis,
        CartesianGrid,
        Tooltip as RechartsTooltip,
        ResponsiveContainer,
} from "recharts";
import { CSVLink } from "react-csv"; // Import CSVLink

const ManageRooms = () => {
        // State declarations for modals and data
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
        const [rooms, setRooms] = useState([]);
        const [editingRoom, setEditingRoom] = useState(null);
        const [searchTerm, setSearchTerm] = useState("");
        const [filteredRooms, setFilteredRooms] = useState([]);
        const [selectedItems, setSelectedItems] = useState([]);

        const [form] = Form.useForm(); // Form instance for add room
        const [updateForm] = Form.useForm(); // Form instance for update room

        const OPTIONS = [
                "WiFi",
                "Air Conditioning",
                "Swimming Pool",
                "Gym",
                "Spa",
                "Restaurant",
        ];

        // CSV data
        const csvHeaders = [
                { label: "Room Number", key: "roomNumber" },
                { label: "Room Type", key: "roomType" },
                { label: "Bed Type", key: "bedType" },
                { label: "Size", key: "size" },
                { label: "View Information", key: "viewInformation" },
                { label: "Facilities", key: "facilities" },
                { label: "Price", key: "price" },
                { label: "Amenities", key: "amenities" },
                { label: "Status", key: "status" },
        ];

        const filteredOptions = OPTIONS.filter(
                (option) => !selectedItems.includes(option)
        );

        // Show and hide modals
        const showModal = () => setIsModalOpen(true);
        const handleCancel = () => {
                setIsModalOpen(false);
                form.resetFields();
        };

        const showUpdateModal = (room) => {
                setEditingRoom(room);
                setIsUpdateModalOpen(true);
                updateForm.setFieldsValue(room);
                setSelectedItems(room.amenities || []); // Set initial selected amenities
        };

        const handleUpdateCancel = () => {
                setIsUpdateModalOpen(false);
                updateForm.resetFields();
                setEditingRoom(null);
        };

        // Fetch rooms from the API
        const fetchRooms = async () => {
                try {
                        const response = await axios.get("/api/room/getRooms");
                        setRooms(response.data.rooms);
                        setFilteredRooms(response.data.rooms); // Initialize filteredRooms with all rooms
                } catch (err) {
                        console.log(err);
                }
        };

        useEffect(() => {
                fetchRooms();
        }, []);

        // Update filtered rooms when search term changes
        useEffect(() => {
                const tempList = rooms.filter(
                        (room) =>
                                (room.roomType &&
                                        room.roomType
                                                .toLowerCase()
                                                .includes(
                                                        searchTerm.toLowerCase()
                                                )) || // Filter by room type
                                (room.roomNumber &&
                                        room.roomNumber
                                                .toLowerCase()
                                                .includes(
                                                        searchTerm.toLowerCase()
                                                )) || // Filter by room number
                                (room.facilities &&
                                        room.facilities
                                                .toLowerCase()
                                                .includes(
                                                        searchTerm.toLowerCase()
                                                )) // Filter by room facilities
                );
                setFilteredRooms(tempList);
        }, [searchTerm, rooms]);

        // Handle search input change
        const handleSearchChange = (e) => {
                setSearchTerm(e.target.value);
        };

        // Add new room
        const addRoom = async () => {
                try {
                        const values = await form.validateFields();
                        const roomData = {
                                ...values,
                                amenities: selectedItems,
                        }; // Include amenities
                        await axios.post("/api/room/addRoom", roomData);
                        setIsModalOpen(false);
                        message.success("Room added successfully");
                        fetchRooms();
                        form.resetFields();
                } catch (err) {
                        console.log(err);
                        message.error(
                                err.response?.data?.message ||
                                        "Failed to add room"
                        );
                }
        };

        // Update room
        const handleUpdate = async () => {
                try {
                        const values = await updateForm.validateFields();
                        await axios.put(
                                `/api/room/updateRoom/${editingRoom._id}`,
                                {
                                        ...values,
                                        amenities: selectedItems,
                                }
                        );
                        setIsUpdateModalOpen(false);
                        message.success("Room updated successfully");
                        fetchRooms();
                        updateForm.resetFields();
                } catch (err) {
                        console.log(err);
                        message.error(
                                err.response?.data?.message ||
                                        "Failed to update room"
                        );
                }
        };

        // Delete room
        const deleteRoom = async (id) => {
                try {
                        await axios.delete(`/api/room/deleteRoom/${id}`);
                        message.success("Room deleted successfully");
                        fetchRooms(); // Refresh the list of rooms after deletion
                } catch (err) {
                        console.log(err);
                        message.error("Failed to delete room");
                }
        };

        // Table columns for Ant Design Table component
        const columns = [
                {
                        title: "Room no",
                        dataIndex: "roomNumber",
                        key: "roomNumber",
                        render: (text) => <a>{text}</a>,
                },
                {
                        title: "Room Type",
                        dataIndex: "roomType",
                        key: "roomType",
                },
                {
                        title: "Facilities",
                        dataIndex: "facilities",
                        key: "facilities",
                },
                {
                        title: "Price",
                        dataIndex: "price",
                        key: "price",
                },
                {
                        title: "Status",
                        key: "status",
                        dataIndex: "status",
                        render: (status) => (
                            <Tag
                                color={status === "Suspended" ? "volcano" : "green"}
                            >
                                {status === "Suspended" ? "MAINTENANCE" : status.toUpperCase()}
                            </Tag>
                        ),
                    }
                    ,
                {
                        title: "Action",
                        key: "action",
                        render: (_, record) => (
                                <Space size="middle">
                                        <Icon
                                                onClick={() =>
                                                        showUpdateModal(record)
                                                }
                                                icon="akar-icons:edit"
                                                width="24"
                                                height="24"
                                        />
                                        <Icon
                                                onClick={() =>
                                                        deleteRoom(record._id)
                                                }
                                                icon="material-symbols:delete"
                                                width="24"
                                                height="24"
                                        />
                                </Space>
                        ),
                },
        ];

        return (
                <div className="manage_room">
                        <div className="manage_room_content">
                                <div className="manage_room_header">
                                        <h1>Manage Rooms</h1>
                                        <div className="search-container-122313">
                                                <div className="search-bar_">
                                                        <Input
                                                                type="text"
                                                                placeholder="Search rooms"
                                                                value={
                                                                        searchTerm
                                                                }
                                                                onChange={
                                                                        handleSearchChange
                                                                }
                                                                style={{
                                                                        width: 300,
                                                                        marginLeft: 20,
                                                                        height: 40,
                                                                }}
                                                        />
                                                </div>
                                                <button
                                                        className="add_new_room"
                                                        onClick={showModal}
                                                >
                                                        Add Room
                                                </button>
                                                <button className="download_pkg">
                                                        <CSVLink
                                                                data={
                                                                        filteredRooms
                                                                } // Data to be exported
                                                                headers={
                                                                        csvHeaders
                                                                } // Headers for CSV
                                                                filename={
                                                                        "rooms-list.csv"
                                                                } // Name of the downloaded file
                                                                className="download-link"
                                                                target="_blank"
                                                                style={{
                                                                        textDecoration:
                                                                                "none",
                                                                        color: "inherit",
                                                                }} // Remove underline and keep original color
                                                        >
                                                                Download CSV
                                                        </CSVLink>
                                                </button>
                                        </div>
                                        <Modal
                                                title="Add Room"
                                                open={isModalOpen}
                                                onOk={addRoom}
                                                onCancel={handleCancel}
                                        >
                                                <Form
                                                        form={form}
                                                        layout="vertical"
                                                >
                                                        <Form.Item
                                                                label="Image URL"
                                                                name="imageUrl"
                                                        >
                                                                <Input placeholder="Paste image URL" />
                                                        </Form.Item>
                                                        <Form.Item
                                                                label="Room Number"
                                                                name="roomNumber"
                                                                rules={[
                                                                        {
                                                                                required: true,
                                                                                message: "Please enter the room number",
                                                                        },
                                                                ]}
                                                        >
                                                                <Input placeholder="Enter room number" />
                                                        </Form.Item>
                                                        <Form.Item
                                                                label="Room Type"
                                                                name="roomType"
                                                                rules={[
                                                                        {
                                                                                required: true,
                                                                                message: "Please enter the room type",
                                                                        },
                                                                ]}
                                                        >
                                                                <Input placeholder="Enter room type" />
                                                        </Form.Item>
                                                        <Form.Item
                                                                label="Room Facilities"
                                                                name="facilities"
                                                                rules={[
                                                                        {
                                                                                required: true,
                                                                                message: "Please enter the room facilities",
                                                                        },
                                                                ]}
                                                        >
                                                                <Input placeholder="Enter room facilities" />
                                                        </Form.Item>
                                                        <Form.Item
                                                                label="Bed Type"
                                                                name="bedType"
                                                                rules={[
                                                                        {
                                                                                required: true,
                                                                                message: "Please enter the bed type",
                                                                        },
                                                                ]}
                                                        >
                                                                <Input placeholder="Enter bed type" />
                                                        </Form.Item>
                                                        <Form.Item
                                                                label="Number of Person"
                                                                name="size"
                                                                rules={[
                                                                        {
                                                                                required: true,
                                                                                message: "Please enter the number of person",
                                                                        },
                                                                        {
                                                                                type: "number",
                                                                                message: "Price must be a number",
                                                                                transform: (
                                                                                        value
                                                                                ) =>
                                                                                        Number(
                                                                                                value
                                                                                        ),
                                                                        },
                                                                ]}
                                                        >
                                                                <Input placeholder="Enter the number of person" />
                                                        </Form.Item>
                                                        <Form.Item
                                                                label="View information"
                                                                name="viewInformation"
                                                        >
                                                                <Input placeholder="Enter View Information" />
                                                        </Form.Item>
                                                        <Form.Item
                                                                label="Room Price"
                                                                name="price"
                                                                rules={[
                                                                        {
                                                                                required: true,
                                                                                message: "Please enter the room price",
                                                                        },
                                                                        {
                                                                                type: "number",
                                                                                message: "Price must be a number",
                                                                                transform: (
                                                                                        value
                                                                                ) =>
                                                                                        Number(
                                                                                                value
                                                                                        ),
                                                                        },
                                                                ]}
                                                        >
                                                                <InputNumber
                                                                        placeholder="Enter room price"
                                                                        style={{
                                                                                width: "100%",
                                                                        }}
                                                                />
                                                        </Form.Item>
                                                        <Form.Item
                                                                label="Room Amenities"
                                                                name="amenities"
                                                                rules={[
                                                                        {
                                                                                required: true,
                                                                                message: "Please select the Room Amenities",
                                                                        },
                                                                ]}
                                                        >
                                                                <Select
                                                                        mode="multiple"
                                                                        placeholder="Select Room Amenities"
                                                                        value={
                                                                                selectedItems
                                                                        }
                                                                        onChange={
                                                                                setSelectedItems
                                                                        }
                                                                        style={{
                                                                                width: "100%",
                                                                        }}
                                                                        options={filteredOptions.map(
                                                                                (
                                                                                        item
                                                                                ) => ({
                                                                                        value: item,
                                                                                        label: item,
                                                                                })
                                                                        )}
                                                                />
                                                        </Form.Item>
                                                        <Form.Item
                                                                label="Room Status"
                                                                name="status"
                                                                rules={[
                                                                        {
                                                                                required: true,
                                                                                message: "Please select the room status",
                                                                        },
                                                                ]}
                                                        >
                                                                <Select
                                                                        style={{
                                                                                width: "100%",
                                                                        }}
                                                                        options={[
                                                                                {
                                                                                        value: "Activate",
                                                                                        label: "Activate",
                                                                                },
                                                                                {
                                                                                        value: "Suspended",
                                                                                        label: "Suspended",
                                                                                },
                                                                        ]}
                                                                />
                                                        </Form.Item>
                                                </Form>
                                        </Modal>
                                </div>
                                {/* Room Analytics Section */}
                                <div className="Type_Distribution">
                                        <RoomAnalyticsDashboard />
                                </div>
                                <div className="manageroom_table">
                                        <Table
                                                columns={columns}
                                                dataSource={[
                                                        ...filteredRooms,
                                                ].reverse()} // Use filteredRooms instead of rooms
                                                pagination={{ pageSize: 6 }} // Display 6 rows per page
                                        />
                                </div>

                                <Modal
                                        title="Update Room"
                                        open={isUpdateModalOpen}
                                        onOk={handleUpdate}
                                        onCancel={handleUpdateCancel}
                                >
                                        <Form
                                                form={updateForm}
                                                layout="vertical"
                                        >
                                                <Form.Item
                                                        label="Image URL"
                                                        name="imageUrl"
                                                >
                                                        <Input placeholder="Paste image URL" />
                                                </Form.Item>
                                                <Form.Item
                                                        label="Room Number"
                                                        name="roomNumber"
                                                        rules={[
                                                                {
                                                                        required: true,
                                                                        message: "Please enter the room number",
                                                                },
                                                        ]}
                                                >
                                                        <Input placeholder="Enter room number" />
                                                </Form.Item>
                                                <Form.Item
                                                        label="Room Type"
                                                        name="roomType"
                                                        rules={[
                                                                {
                                                                        required: true,
                                                                        message: "Please enter the room type",
                                                                },
                                                        ]}
                                                >
                                                        <Input placeholder="Enter room type" />
                                                </Form.Item>
                                                <Form.Item
                                                        label="Room Facilities"
                                                        name="facilities"
                                                        rules={[
                                                                {
                                                                        required: true,
                                                                        message: "Please enter the room facilities",
                                                                },
                                                        ]}
                                                >
                                                        <Input placeholder="Enter room facilities" />
                                                </Form.Item>
                                                <Form.Item
                                                        label="Bed Type"
                                                        name="bedType"
                                                        rules={[
                                                                {
                                                                        required: true,
                                                                        message: "Please enter the bed type",
                                                                },
                                                        ]}
                                                >
                                                        <Input placeholder="Enter bed type" />
                                                </Form.Item>
                                                <Form.Item
                                                        label="Number of Person"
                                                        name="size"
                                                        rules={[
                                                                {
                                                                        required: true,
                                                                        message: "Please enter the number of person",
                                                                },
                                                                {
                                                                        type: "number",
                                                                        message: "Price must be a number",
                                                                        transform: (
                                                                                value
                                                                        ) =>
                                                                                Number(
                                                                                        value
                                                                                ),
                                                                },
                                                        ]}
                                                >
                                                        <Input placeholder="Enter the number of person" />
                                                </Form.Item>
                                                <Form.Item
                                                        label="View information"
                                                        name="viewInformation"
                                                >
                                                        <Input placeholder="Enter View Information" />
                                                </Form.Item>
                                                <Form.Item
                                                        label="Room Price"
                                                        name="price"
                                                        rules={[
                                                                {
                                                                        required: true,
                                                                        message: "Please enter the room price",
                                                                },
                                                                {
                                                                        type: "number",
                                                                        message: "Price must be a number",
                                                                        transform: (
                                                                                value
                                                                        ) =>
                                                                                Number(
                                                                                        value
                                                                                ),
                                                                },
                                                        ]}
                                                >
                                                        <InputNumber
                                                                placeholder="Enter room price"
                                                                style={{
                                                                        width: "100%",
                                                                }}
                                                        />
                                                </Form.Item>
                                                <Form.Item
                                                        label="Room Amenities"
                                                        name="amenities"
                                                        rules={[
                                                                {
                                                                        required: true,
                                                                        message: "Please select the Room Amenities",
                                                                },
                                                        ]}
                                                >
                                                        <Select
                                                                mode="multiple"
                                                                placeholder="Select Room Amenities"
                                                                value={
                                                                        selectedItems
                                                                }
                                                                onChange={
                                                                        setSelectedItems
                                                                }
                                                                style={{
                                                                        width: "100%",
                                                                }}
                                                                options={filteredOptions.map(
                                                                        (
                                                                                item
                                                                        ) => ({
                                                                                value: item,
                                                                                label: item,
                                                                        })
                                                                )}
                                                        />
                                                </Form.Item>
                                                <Form.Item
                                                        label="Room Status"
                                                        name="status"
                                                        rules={[
                                                                {
                                                                        required: true,
                                                                        message: "Please select the room status",
                                                                },
                                                        ]}
                                                >
                                                        <Select
                                                                style={{
                                                                        width: "100%",
                                                                }}
                                                                options={[
                                                                        {
                                                                                value: "Activate",
                                                                                label: "Activate",
                                                                        },
                                                                        {
                                                                                value: "Suspended",
                                                                                label: "Suspended",
                                                                        },
                                                                ]}
                                                        />
                                                </Form.Item>
                                        </Form>
                                </Modal>
                        </div>
                </div>
        );
};

// Room Analytics Dashboard Component
const RoomAnalyticsDashboard = () => {
        const [analytics, setAnalytics] = useState({
                occupancyRate: 0,
                averagePrice: 0,
                roomTypeDistribution: [],
                revenueData: [],
                popularAmenities: [],
        });

        useEffect(() => {
                const calculateAnalytics = async () => {
                        try {
                                // Fetch both rooms and reservations data
                                const [roomsResponse, bookingsResponse] =
                                        await Promise.all([
                                                axios.get("/api/room/getRooms"),
                                                axios.get(
                                                        "/api/room/getBookings"
                                                ),
                                        ]);

                                const rooms = roomsResponse.data.rooms;
                                const bookings = bookingsResponse.data.bookings;

                                // Calculate occupancy rate
                                const activeRooms = rooms.filter(
                                        (room) => room.status === "Activate"
                                ).length;
                                const currentBookings = bookings.filter(
                                        (booking) =>
                                                new Date(booking.checkInDate) <=
                                                        new Date() &&
                                                new Date(
                                                        booking.checkOutDate
                                                ) >= new Date()
                                ).length;
                                const occupancyRate =
                                        (currentBookings / activeRooms) * 100;

                                // Calculate average room price
                                const averagePrice =
                                        rooms.reduce(
                                                (acc, room) => acc + room.price,
                                                0
                                        ) / rooms.length;

                                // Calculate room type distribution
                                const typeCount = rooms.reduce((acc, room) => {
                                        acc[room.roomType] =
                                                (acc[room.roomType] || 0) + 1;
                                        return acc;
                                }, {});
                                const roomTypeDistribution = Object.entries(
                                        typeCount
                                ).map(([type, count]) => ({
                                        type,
                                        count,
                                }));

                                // Calculate revenue data (last 7 days)
                                const last7Days = [...Array(7)]
                                        .map((_, i) => {
                                                const date = new Date();
                                                date.setDate(
                                                        date.getDate() - i
                                                );
                                                return date
                                                        .toISOString()
                                                        .split("T")[0];
                                        })
                                        .reverse();

                                const revenueData = last7Days.map((date) => ({
                                        date,
                                        revenue: bookings
                                                .filter(
                                                        (booking) =>
                                                                booking.checkInDate.split(
                                                                        "T"
                                                                )[0] === date
                                                )
                                                .reduce(
                                                        (acc, booking) =>
                                                                acc +
                                                                booking.totalAmount,
                                                        0
                                                ),
                                }));

                                // Calculate popular amenities
                                const amenitiesCount = rooms.reduce(
                                        (acc, room) => {
                                                room.amenities.forEach(
                                                        (amenity) => {
                                                                acc[amenity] =
                                                                        (acc[
                                                                                amenity
                                                                        ] ||
                                                                                0) +
                                                                        1;
                                                        }
                                                );
                                                return acc;
                                        },
                                        {}
                                );
                                const popularAmenities = Object.entries(
                                        amenitiesCount
                                )
                                        .map(([name, count]) => ({
                                                name,
                                                count,
                                        }))
                                        .sort((a, b) => b.count - a.count)
                                        .slice(0, 5);

                                setAnalytics({
                                        occupancyRate,
                                        averagePrice,
                                        roomTypeDistribution,
                                        revenueData,
                                        popularAmenities,
                                });
                        } catch (error) {
                                console.error(
                                        "Error fetching analytics:",
                                        error
                                );
                        }
                };

                calculateAnalytics();
                const interval = setInterval(calculateAnalytics, 300000); // Update every 5 minutes
                return () => clearInterval(interval);
        }, []);

        return (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card
                                className="shadow-lg"
                                title="Room Type Distribution"
                        >
                                <ResponsiveContainer width="100%" height={300}>
                                        <BarChart
                                                data={
                                                        analytics.roomTypeDistribution
                                                }
                                        >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="type" />
                                                <YAxis />
                                                <RechartsTooltip />
                                                <Bar
                                                        dataKey="count"
                                                        fill="#82ca9d"
                                                />
                                        </BarChart>
                                </ResponsiveContainer>
                        </Card>
                </div>
        );
};

export default ManageRooms;
