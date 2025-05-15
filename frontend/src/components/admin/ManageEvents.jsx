import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  message,
  Popconfirm,
  Tag,
  Card,
  Row,
  Col,
  Input,
  Space,
  Select,
  Typography
} from "antd";
import axios from "axios";
import { CSVLink } from "react-csv";
import { SearchOutlined, DeleteOutlined, DownloadOutlined } from "@ant-design/icons";
import moment from "moment";

const { Option } = Select;
const { Title } = Typography;

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortField, setSortField] = useState("checkInDate");
  const [sortOrder, setSortOrder] = useState("descend"); // Default to descending (newest first)

  const statusColors = {
    pending: "orange",
    confirmed: "green",
    cancelled: "red",
  };

  useEffect(() => {
    fetchBookings();
  }, [pagination.current, searchText, selectedStatus, sortField, sortOrder]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/booking/allBookings", {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
          search: searchText,
          status: selectedStatus === "all" ? undefined : selectedStatus,
          sortField,
          sortOrder,
        },
      });
      
      // Sort bookings by check-in date (newest first) if the API doesn't support sorting
      const sortedBookings = [...data.bookings].sort((a, b) => {
        return sortOrder === "descend" 
          ? new Date(b.checkInDate) - new Date(a.checkInDate)
          : new Date(a.checkInDate) - new Date(b.checkInDate);
      });
      
      setBookings(sortedBookings);
      setPagination({
        ...pagination,
        total: data.totalBookings,
        totalPages: data.totalPages,
      });
    } catch (error) {
      message.error("Failed to fetch bookings");
      console.error("Fetch bookings error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await axios.post(`/api/booking/updateStatus/${bookingId}`, { status: newStatus });
      message.success("Booking status updated");
      fetchBookings();
    } catch (error) {
      message.error("Failed to update status");
    }
  };

  const handleDelete = async (bookingId) => {
    try {
      await axios.delete(`/api/booking/${bookingId}`);
      message.success("Booking deleted");
      fetchBookings();
    } catch (error) {
      message.error("Failed to delete booking");
    }
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setPagination(pagination);
    
    // Update sort field and order based on table headers click
    if (sorter && sorter.field) {
      setSortField(sorter.field);
      setSortOrder(sorter.order || "descend");
    }
  };

  const handleDownloadBooking = async (bookingId) => {
    try {
      const response = await axios.get(`/api/booking/getBookingDetails/${bookingId}`);
      const bookingData = response.data;
  
      if (!bookingData) {
        message.error("Booking details not found.");
        return;
      }
      
      // Get package name properly
      const packageName = bookingData.package ? bookingData.package.name : 
                         (typeof bookingData.packageId === 'object' && bookingData.packageId.name) ? 
                         bookingData.packageId.name : "N/A";
  
      const csvData = [
        [
          "Guest Name",
          "Email",
          "Phone",
          "Package",
          "Check-in",
          "Check-out",
          "Amount",
          "Status",
        ],
        [
          bookingData.guestName,
          bookingData.guestEmail,
          bookingData.guestPhone,
          packageName,
          moment(bookingData.checkInDate).format("MMM Do YYYY"),
          moment(bookingData.checkOutDate).format("MMM Do YYYY"),
          `$${bookingData.totalAmount.toFixed(2)}`,
          bookingData.status,
        ],
      ];
  
      const csvBlob = new Blob([csvData.map(row => row.join(",")).join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
  
      const link = document.createElement("a");
      link.href = URL.createObjectURL(csvBlob);
      link.download = `booking_${bookingId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
      message.error("Failed to download booking details.");
    }
  };

  // Prepare CSV data for group exports with proper package name
  const prepareCSVData = (bookingsData) => {
    return bookingsData.map(booking => ({
      "Guest Name": booking.guestName,
      "Email": booking.guestEmail,
      "Phone": booking.guestPhone,
      "Package": booking.packageId && booking.packageId.name ? booking.packageId.name : "N/A",
      "Check-in": moment(booking.checkInDate).format("MMM Do YYYY"),
      "Check-out": moment(booking.checkOutDate).format("MMM Do YYYY"),
      "Nights": moment(booking.checkOutDate).diff(moment(booking.checkInDate), "days"),
      "Amount": `$${booking.totalAmount.toFixed(2)}`,
      "Status": booking.status
    }));
  };

  const columns = [
    {
      title: "Guest",
      dataIndex: "guestName",
      key: "guest",
      render: (text, record) => (
        <div>
          <strong>{text}</strong>
          <div>{record.guestEmail}</div>
          <div>{record.guestPhone}</div>
        </div>
      ),
    },
    {
      title: "Package",
      dataIndex: ["packageId", "name"],
      key: "package",
      render: (text) => text || "N/A",
    },
    {
      title: "Dates",
      key: "dates",
      dataIndex: "checkInDate",
      sorter: true,
      sortOrder: sortField === "checkInDate" ? sortOrder : null,
      render: (_, record) => (
        <div>
          <div>Check-in: {moment(record.checkInDate).format("MMM Do YYYY")}</div>
          <div>Check-out: {moment(record.checkOutDate).format("MMM Do YYYY")}</div>
          <div>
            Nights: {moment(record.checkOutDate).diff(moment(record.checkInDate), "days")}
          </div>
        </div>
      ),
    },
    {
      title: "Amount",
      dataIndex: "totalAmount",
      key: "amount",
      render: (amount) => `$${amount.toFixed(2)}`,
      align: "right",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={statusColors[status] || "blue"}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Select
            defaultValue={record.status}
            style={{ width: 120 }}
            onChange={(value) => handleStatusChange(record._id, value)}
          >
            <Option value="pending">Pending</Option>
            <Option value="confirmed">Confirmed</Option>
            <Option value="cancelled">Cancelled</Option>
          </Select>

          <Popconfirm
            title="Are you sure to delete this booking?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            
          </Popconfirm>
          
          
        </Space>
      ),
    },
  ];

  const confirmedBookings = bookings.filter((booking) => booking.status === "confirmed");
  const pendingBookings = bookings.filter((booking) => booking.status === "pending");
  const totalConfirmedAmount = confirmedBookings.reduce((acc, booking) => acc + booking.totalAmount, 0);

  return (
    <div style={{ padding: "20px" }}>
      <Card title="Manage Bookings">
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Input
              placeholder="Search by guest name, email or status"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={12} style={{ textAlign: "right" }}>
            <CSVLink 
              data={prepareCSVData(confirmedBookings)} 
              filename={"confirmed_bookings.csv"}
            >
              <Button type="primary" icon={<DownloadOutlined />}>Export Confirmed</Button>
            </CSVLink>
            <CSVLink 
              data={prepareCSVData(pendingBookings)} 
              filename={"pending_bookings.csv"} 
              style={{ marginLeft: 10 }}
            >
              <Button type="primary" icon={<DownloadOutlined />}>Export Pending</Button>
            </CSVLink>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={bookings}
          rowKey="_id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: true }}
        />

        <Title level={4} style={{ marginTop: 20 }}>
          {`Total Confirmed Bookings Revenue: $${totalConfirmedAmount.toFixed(2)}`}
        </Title>
      </Card>
    </div>
  );
};

export default ManageBookings;