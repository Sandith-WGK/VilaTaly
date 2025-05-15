import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Modal,
  Button,
  Form,
  Input,
  DatePicker,
  message,
  Table,
  Tag,
  Space,
  Popconfirm,
  Select,
  Alert,
  Dropdown,
  Menu,
} from "antd";
import moment from "moment";
import {
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileTextOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import 'jspdf-autotable';
import logo from '../../assets/Logo/logo-white.png';

const { Option } = Select;

const EventBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState("");
  const itemsPerPage = 5;

  const statusColors = {
    pending: "orange",
    confirmed: "green",
    cancelled: "red",
  };

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (currentUser) {
      setUserRole(currentUser.role);
      setUserId(currentUser._id);
    }
    fetchBookings();
  }, [userRole]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      let response;
      if (userRole === "admin") {
        response = await axios.get("/api/booking/allBookings");
      } else {
        response = await axios.get("/api/booking/userBookings", {
          params: { userId: currentUser._id },
        });
      }

      let filtered = response.data.bookings || [];
      if (userRole === "guest") {
        filtered = filtered.filter((booking) => booking.status === "confirmed");
      }

      setBookings(response.data.bookings || []);
      setFilteredBookings(filtered);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      message.error(
        error.response?.data?.message || "Failed to fetch bookings"
      );
      setBookings([]);
      setFilteredBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (booking) => {
    if (booking.status !== "pending" && userRole !== "admin") {
      message.warning("Only pending bookings can be edited");
      return;
    }

    setSelectedBooking(booking);
    form.setFieldsValue({
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (bookingId, status) => {
    if (status !== "pending" && userRole !== "admin") {
      message.warning("Only pending bookings can be deleted");
      return;
    }

    try {
      await axios.delete(`/api/booking/${bookingId}`);
      message.success("Booking deleted successfully");
      fetchBookings();
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to delete booking"
      );
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const updatedFields = {
        guestName: values.guestName,
        guestEmail: values.guestEmail,
        guestPhone: values.guestPhone,
      };

      const response = await axios.put(
        `/api/booking/updateStatus/${selectedBooking._id}`,
        updatedFields
      );

      message.success("Booking updated successfully");
      setIsModalOpen(false);
      fetchBookings();
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update booking"
      );
    }
  };

  const handleDownloadCSV = (booking) => {
    const csvData = [
      [
        "Package",
        "Check-In",
        "Check-Out",
        "Amount",
        "Status",
        "Guest Name",
        "Guest Email",
        "Guest Phone",
      ],
      [
        booking.packageId?.name,
        moment(booking.checkInDate).format("YYYY-MM-DD"),
        moment(booking.checkOutDate).format("YYYY-MM-DD"),
        `$${booking.totalAmount}`,
        booking.status.toUpperCase(),
        booking.guestName,
        booking.guestEmail,
        booking.guestPhone,
      ],
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `booking_${booking._id}.csv`);
  };

  const generatePDF = (booking) => {
    // Create a new jsPDF instance
    const doc = new jsPDF();
    
    // Add logo to the top right corner
    const imgWidth = 30;
    const imgHeight = 30;
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.addImage(logo, 'PNG', pageWidth - imgWidth - 14, 12, imgWidth, imgHeight);
    
    // Add title with green color and bold
    doc.setFontSize(24);
    doc.setTextColor(33, 150, 83); // RGB values for a nice green color
    doc.setFont(undefined, 'bold');
    doc.text('Booking Confirmation', 14, 25);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    
    // Add report generation info
    doc.setFontSize(10);
    doc.text(`Generated on: ${moment().format('MMMM D, YYYY [at] h:mm A')}`, 14, 38);
    
    // Booking Reference and Date
    let yPos = 48;
    doc.setFontSize(16);
    doc.setTextColor(33, 150, 83); // Green color
    doc.setFont(undefined, 'bold');
    doc.text('Booking Details:', 14, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 6;

    const bookingTable = [
      ['Booking Reference', booking._id],
      ['Date Generated', moment().format('MMMM DD, YYYY')],
      ['Status', booking.status.toUpperCase()]
    ];

    doc.autoTable({
      head: [['Field', 'Value']],
      body: bookingTable,
      startY: yPos,
      headStyles: { fillColor: [33, 150, 83] },
      margin: { left: 14 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 100 }
      }
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // Package and Stay Details
    doc.setFontSize(16);
    doc.setTextColor(33, 150, 83); // Green color
    doc.setFont(undefined, 'bold');
    doc.text('Stay Details', 14, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 6;

    const checkIn = moment(booking.checkInDate);
    const checkOut = moment(booking.checkOutDate);
    const nights = checkOut.diff(checkIn, 'days');

    const stayTable = [
      ['Package', booking.packageId?.name || 'N/A'],
      ['Check-In Date', moment(booking.checkInDate).format('MMMM DD, YYYY')],
      ['Check-Out Date', moment(booking.checkOutDate).format('MMMM DD, YYYY')],
      ['Duration', `${nights} night${nights !== 1 ? 's' : ''}`],
      ['Total Amount', `$${booking.totalAmount}`]
    ];

    doc.autoTable({
      head: [['Detail', 'Information']],
      body: stayTable,
      startY: yPos,
      headStyles: { fillColor: [33, 150, 83] },
      margin: { left: 14 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 100 }
      }
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // Guest Information
    doc.setFontSize(16);
    doc.setTextColor(33, 150, 83); // Green color
    doc.setFont(undefined, 'bold');
    doc.text('Guest Information', 14, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 6;

    const guestTable = [
      ['Name', booking.guestName],
      ['Email', booking.guestEmail],
      ['Phone', booking.guestPhone]
    ];

    doc.autoTable({
      head: [['Field', 'Value']],
      body: guestTable,
      startY: yPos,
      headStyles: { fillColor: [33, 150, 83] },
      margin: { left: 14 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 100 }
      }
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // Terms and Conditions
    doc.setFontSize(16);
    doc.setTextColor(33, 150, 83); // Green color
    doc.setFont(undefined, 'bold');
    doc.text('Terms & Conditions', 14, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 6;

    const termsTable = [
      ['1', 'Check-in time is from 2:00 PM, and check-out time is until 12:00 PM.'],
      ['2', 'Cancellations must be made at least 48 hours before check-in to avoid charges.'],
      ['3', 'A valid ID and credit card are required at check-in for incidental charges.'],
      ['4', 'Pets are not allowed unless specifically booked in a pet-friendly accommodation.']
    ];

    doc.autoTable({
      body: termsTable,
      startY: yPos,
      headStyles: { fillColor: [33, 150, 83] },
      margin: { left: 14 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 140 }
      }
    });

    // Add footer
    doc.setFontSize(8);
    doc.text('Thank you for choosing our services!', 105, 280, { align: 'center' });
    doc.text('For any questions, please contact our customer service at support@example.com', 105, 285, { align: 'center' });
    
    // Save the PDF
    doc.save(`booking_${booking._id}.pdf`);
  };
  
  const generateFullReport = (bookings) => {
    // Create a new jsPDF instance in landscape mode
    const doc = new jsPDF('landscape');
    
    // Add title
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text("Bookings Report", 150, 20, { align: 'center' });
    
    // Add date generated
    doc.setFontSize(10);
    doc.text(`Generated on: ${moment().format('MMMM DD, YYYY')}`, 150, 30, { align: 'center' });
    
    // Prepare table data
    const tableColumn = ["Package", "Check-In", "Check-Out", "Nights", "Guest Name", "Email", "Phone", "Amount", "Status"];
    const tableRows = [];
    
    bookings.forEach(booking => {
      const checkIn = moment(booking.checkInDate);
      const checkOut = moment(booking.checkOutDate);
      const nights = checkOut.diff(checkIn, 'days');
      
      const bookingData = [
        booking.packageId?.name || 'N/A',
        moment(booking.checkInDate).format('YYYY-MM-DD'),
        moment(booking.checkOutDate).format('YYYY-MM-DD'),
        nights.toString(),
        booking.guestName,
        booking.guestEmail,
        booking.guestPhone,
        `$${booking.totalAmount}`,
        booking.status.toUpperCase()
      ];
      tableRows.push(bookingData);
    });
    
    // Generate the table
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 102, 204], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      columnStyles: {
        7: { halign: 'right' }, // Amount column right aligned
        8: { halign: 'center' }  // Status column centered
      }
    });
    
    // Add statistical summary
    const lastY = doc.autoTable.previous.finalY + 15;
    
    // Calculate summary data
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status.toLowerCase() === 'confirmed').length;
    const pendingBookings = bookings.filter(b => b.status.toLowerCase() === 'pending').length;
    const cancelledBookings = bookings.filter(b => b.status.toLowerCase() === 'cancelled').length;
    const totalRevenue = bookings
      .filter(b => b.status.toLowerCase() === 'confirmed')
      .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
    
    // Add summary header
    doc.setFontSize(14);
    doc.setTextColor(0, 102, 204);
    doc.text("Booking Summary", 20, lastY);
    
    // Add summary data
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text(`Total Bookings: ${totalBookings}`, 20, lastY + 10);
    doc.text(`Confirmed Bookings: ${confirmedBookings}`, 20, lastY + 20);
    doc.text(`Pending Bookings: ${pendingBookings}`, 20, lastY + 30);
    doc.text(`Cancelled Bookings: ${cancelledBookings}`, 20, lastY + 40);
    doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 20, lastY + 50);
    
    // Add footer
    doc.setFontSize(8);
    doc.text("Report generated by Booking Management System", 150, 200, { align: 'center' });
    
    // Save the PDF
    doc.save(`bookings_report_${moment().format('YYYY-MM-DD')}.pdf`);
  };
  
  const exportMenu = (record) => (
    <Menu>
      <Menu.Item key="1" icon={<FileExcelOutlined />} onClick={() => handleDownloadCSV(record)}>
        Export as CSV
      </Menu.Item>
      <Menu.Item key="2" icon={<FilePdfOutlined />} onClick={() => generatePDF(record)}>
        Export as PDF
      </Menu.Item>
    </Menu>
  );

  const columns = [
    {
      title: "Package",
      dataIndex: ["packageId", "name"],
      key: "package",
    },
    {
      title: "Check-In",
      dataIndex: "checkInDate",
      key: "checkIn",
      render: (date) => moment(date).format("YYYY-MM-DD"),
    },
    {
      title: "Check-Out",
      dataIndex: "checkOutDate",
      key: "checkOut",
      render: (date) => moment(date).format("YYYY-MM-DD"),
    },
    {
      title: "Amount",
      dataIndex: "totalAmount",
      key: "amount",
      render: (amount) => `$${amount}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={statusColors[status.toLowerCase()]}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={record.status !== "pending" && userRole !== "admin"}
          ></Button>
          <Popconfirm
            title="Are you sure to delete this booking?"
            onConfirm={() => handleDelete(record._id, record.status)}
            okText="Yes"
            cancelText="No"
            disabled={record.status !== "pending" && userRole !== "admin"}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={record.status !== "pending" && userRole !== "admin"}
            ></Button>
          </Popconfirm>
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            onClick={() => generatePDF(record)}
            disabled={loading}
          >
            Download PDF
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="event-bookings-container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2>{userRole === "admin" ? "All Bookings" : "My Bookings"}</h2>
        <Space>
          {userRole === "admin" && (
            <Button
              type="primary"
              onClick={() => {
                setSelectedBooking(null);
                form.resetFields();
                setIsModalOpen(true);
              }}
            >
              Add New Booking
            </Button>
          )}
          {userRole === "admin" && filteredBookings.length > 0 && (
            <Button 
              icon={<FileTextOutlined />}
              onClick={() => generateFullReport(filteredBookings)}
            >
              Generate Full Report
            </Button>
          )}
        </Space>
      </div>

      {userRole === "guest" && filteredBookings.length === 0 && !loading && (
        <Alert
          message="No confirmed bookings found"
          description="Your bookings will appear here once they are confirmed by the admin."
          type="info"
          showIcon
        />
      )}

      <Table
        columns={columns}
        dataSource={filteredBookings}
        rowKey="_id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: itemsPerPage,
          onChange: (page) => setCurrentPage(page),
        }}
      />

      <Modal
        title="Update Booking Details"
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        okText="Update"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="guestName"
            label="Guest Name"
            rules={[{ required: true, message: "Please enter guest name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="guestEmail"
            label="Guest Email"
            rules={[
              { required: true, message: "Please enter guest email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="guestPhone"
            label="Guest Phone"
            rules={[
              { required: true, message: "Please enter guest phone" },
              {
                pattern: /^[0-9]+$/,
                message:
                  "Please enter numbers only (no letters or special characters)",
              },
              {
                min: 10,
                message: "Phone number must be at least 10 digits",
              },
              {
                max: 10,
                message: "Phone number cannot exceed 10 digits",
              },
            ]}
          >
            <Input
              type="tel"
              maxLength={10}
              onKeyPress={(event) => {
                if (!/[0-9]/.test(event.key)) {
                  event.preventDefault();
                }
              }}
            />
          </Form.Item>
          {userRole === "admin" && (
            <Form.Item label="Status">
              <Input value={selectedBooking?.status?.toUpperCase()} readOnly />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default EventBookings;