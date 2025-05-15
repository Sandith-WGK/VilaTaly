import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  Tabs,
  Card,
  Space,
  Button,
  Modal,
  message,
  Input,
  Select,
  DatePicker,
  Form,
  Popconfirm,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  
} from "antd";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { DownloadOutlined } from '@ant-design/icons';


const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title } = Typography;

const ComprehensiveAdminDashboard = () => {
  const [roomOrders, setRoomOrders] = useState([]);
  const [takeawayOrders, setTakeawayOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0 });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const [roomResponse, takeawayResponse] = await Promise.all([
        axios.get("http://localhost:5000/api/order/getOrders"),
        axios.get("http://localhost:5000/api/order/gettakeawayorders"),
      ]);

      const processedRoomOrders = Array.isArray(roomResponse.data.orders)
        ? roomResponse.data.orders
        : [];
      const processedTakeawayOrders = Array.isArray(takeawayResponse.data)
        ? takeawayResponse.data
        : [];

      console.log("Room orders:", processedRoomOrders);
      console.log("Takeaway orders:", processedTakeawayOrders);

      setRoomOrders(processedRoomOrders);
      setTakeawayOrders(processedTakeawayOrders);
      updateStats([...processedRoomOrders, ...processedTakeawayOrders]);
    } catch (error) {
      console.error("Error fetching orders:", error);
      message.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (orders) => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (sum, order) =>
        sum + (Number(order.amount) || Number(order.totalAmount) || 0),
      0
    );
    setStats({ totalOrders, totalRevenue });
  };

   // Download CSV for Room Orders
   const downloadRoomOrdersCSV = () => {
    const headers = [
      "Order ID",
      "Customer Name",
      "Room Number",
      "Meals",
      "Amount",
      "Status",
      "Purchase Date",
    ];

    const csvData = roomOrders.map((order) => [
      order.orderId || order._id,
      order.customerName,
      order.roomNumber,
      order.meals ? order.meals.map((meal) => meal.name).join(", ") : "N/A",
      `$${(Number(order.amount) || Number(order.totalAmount) || 0).toFixed(2)}`,
      order.status,
      order.purchaseDate ? moment(order.purchaseDate).format("YYYY-MM-DD HH:mm") : "N/A",
    ]);

    downloadCSV(headers, csvData, "room_orders.csv");
  };

  // Download CSV for Takeaway/Delivery Orders
  const downloadTakeawayOrdersCSV = () => {
    const headers = [
      "Order ID",
      "Customer Name",
      "Order Type",
      "Phone Number",
      "Address",
      "Meals",
      "Amount",
      "Status",
      "Purchase Date",
    ];

    const csvData = takeawayOrders.map((order) => [
      order.orderId || order._id,
      order.customerName,
      order.orderType,
      order.phoneNumber,
      order.address ? `${order.address.street}, ${order.address.city}` : "N/A",
      order.meals ? order.meals.map((meal) => meal.name).join(", ") : "N/A",
      `$${(Number(order.amount) || Number(order.totalAmount) || 0).toFixed(2)}`,
      order.status,
      order.purchaseDate ? moment(order.purchaseDate).format("YYYY-MM-DD HH:mm") : "N/A",
    ]);

    downloadCSV(headers, csvData, "takeaway_orders.csv");
  };

  // General function to create and download CSV
  const downloadCSV = (headers, data, filename) => {
    let csvContent = headers.join(",") + "\n"; // Add headers
    data.forEach((row) => {
      csvContent += row.join(",") + "\n"; // Add each row of data
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setEditMode(true);
    form.setFieldsValue({
      ...order,
      purchaseDate: order.purchaseDate ? moment(order.purchaseDate) : null,
      meals: order.meals ? order.meals.map((meal) => meal.name).join(", ") : "",
    });
    setModalVisible(true);
  };

  const handleDelete = async (order) => {
    try {
      const endpoint = order.orderId
        ? "http://localhost:5000/api/order/deleteItem"
        : "http://localhost:5000/api/order/deletetakeawayorder";

      await axios.post(endpoint, { orderId: order.orderId || order._id });
      message.success("Order deleted successfully");
      fetchOrders();
    } catch (error) {
      console.error("Error deleting order:", error);
      message.error("Failed to delete order");
    }
  };

  const showOrderDetails = (order) => {
    setSelectedOrder(order);
    setEditMode(false);
    setModalVisible(true);
  };

  const handleSave = async (values) => {
    try {
      const endpoint = selectedOrder.orderId
        ? "http://localhost:5000/api/order/updateItem"
        : "http://localhost:5000/api/order/updatetakeawayorder";

      const updatedOrder = {
        ...values,
        orderId: selectedOrder.orderId || selectedOrder._id,
        meals: values.meals.split(",").map((meal) => ({ name: meal.trim() })),
      };

      if (selectedOrder.orderId) {
        // For room orders
        updatedOrder.roomNumber = selectedOrder.roomNumber;
        updatedOrder.customerID = selectedOrder.customerID;
      } else {
        // For takeaway orders
        updatedOrder.phoneNumber = selectedOrder.phoneNumber;
        updatedOrder.orderType = selectedOrder.orderType;
        updatedOrder.address = selectedOrder.address;
      }

      await axios.post(endpoint, updatedOrder);

      message.success("Order updated successfully");
      setModalVisible(false);
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      message.error("Failed to update order");
    }
  };

  

  const handleFilter = (values) => {
    const { dateRange, status, searchTerm } = values;

    const filterOrders = (orders) => {
      return orders.filter((order) => {
        const dateMatch =
          !dateRange ||
          (moment(order.purchaseDate).isSameOrAfter(dateRange[0], "day") &&
            moment(order.purchaseDate).isSameOrBefore(dateRange[1], "day"));
        const statusMatch = !status || order.status === status;
        const searchMatch =
          !searchTerm ||
          (order.orderId &&
            order.orderId.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (order.customerName &&
            order.customerName
              .toLowerCase()
              .includes(searchTerm.toLowerCase()));
        return dateMatch && statusMatch && searchMatch;
      });
    };

    setRoomOrders(filterOrders(roomOrders));
    setTakeawayOrders(filterOrders(takeawayOrders));
  };

  const resetFilters = () => {
    filterForm.resetFields();
    fetchOrders();
  };

  const columns = [
    {
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
      render: (text, record) => text || record._id,
    },
    { title: "Customer Name", dataIndex: "customerName", key: "customerName" },
    {
      title: "Meals",
      dataIndex: "meals",
      key: "meals",
      render: (meals, record) => {
        if (Array.isArray(meals)) {
          return meals.map((meal) => meal.name).join(", ");
        } else if (typeof record.meals === "string") {
          return record.meals;
        } else {
          return "N/A";
        }
      },
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (text, record) =>
        `$${(Number(text) || Number(record.totalAmount) || 0).toFixed(2)}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={
            status === "Completed"
              ? "green"
              : status === "Pending"
              ? "orange"
              : "red"
          }
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Purchase Date",
      dataIndex: "purchaseDate",
      key: "purchaseDate",
      render: (date) =>
        date ? moment(date).format("YYYY-MM-DD HH:mm") : "N/A",
    },
    {
      title: "Type/Location",
      key: "type",
      render: (_, record) => {
        if (record.roomNumber) {
          return `Room ${record.roomNumber}`;
        } else if (record.orderType === "delivery" && record.address) {
          // Assuming the address is an object with properties like street, city, etc.
          return `${record.address.street}, ${record.address.city}`;
        } else if (record.orderType === "takeaway") {
          return "Takeaway";
        } else {
          return "Unknown";
        }
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<EyeOutlined />}
            onClick={() => showOrderDetails(record)}
          />
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Are you sure you want to delete this order?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={<Title level={2}>Orders Analytics</Title>}
      style={{ margin: "20px", padding: "10px" }}
    >
      <Row gutter={16} style={{ marginBottom: "20px" }}>
        <Col span={12}>
          <Statistic title="Total Orders" value={stats.totalOrders} />
        </Col>
        <Col span={12}>
          <Statistic
            title="Total Revenue"
            value={stats.totalRevenue}
            prefix="$"
            precision={2}
          />
        </Col>
      </Row>

      <Form
        form={filterForm}
        layout="inline"
        onFinish={handleFilter}
        style={{ marginBottom: "20px" }}
      >
        <Form.Item name="dateRange">
          <RangePicker />
        </Form.Item>
        <Form.Item name="status">
          <Select style={{ width: 120 }} placeholder="Status">
            <Option value="Pending">Pending</Option>
            <Option value="Completed">Completed</Option>
            <Option value="Cancelled">Cancelled</Option>
          </Select>
        </Form.Item>
        <Form.Item name="searchTerm">
          <Input
            placeholder="Search order ID or customer"
            prefix={<SearchOutlined />}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" icon={<FilterOutlined />} htmlType="submit">
            Filter
          </Button>
        </Form.Item>
        <Form.Item>
          <Button icon={<SyncOutlined />} onClick={resetFilters}>
            Reset
          </Button>
        </Form.Item>
      </Form>

      <Tabs defaultActiveKey="1">
        <TabPane tab="Room Service Orders" key="1">
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={downloadRoomOrdersCSV}
            style={{ marginBottom: 16 }}
          >
            Download Room Orders CSV
          </Button>
          <Table
            dataSource={roomOrders}
            columns={columns}
            loading={loading}
            rowKey={(record) => record.orderId || record._id}
          />
        </TabPane>
        <TabPane tab="Takeaway/Delivery Orders" key="2">
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={downloadTakeawayOrdersCSV}
            style={{ marginBottom: 16 }}
          >
            Download Takeaway Orders CSV
          </Button>
          <Table
            dataSource={takeawayOrders}
            columns={columns}
            loading={loading}
            rowKey={(record) => record.orderId || record._id}
          />
        </TabPane>
      </Tabs>

      <Modal
        title={
          editMode
            ? selectedOrder
              ? "Edit Order"
              : "Add New Order"
            : "Order Details"
        }
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditMode(false);
        }}
        footer={editMode ? null : undefined}
        width={800}
      >
        {editMode ? (
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item
              name="customerName"
              label="Customer Name"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="amount"
              label="Amount"
              rules={[{ required: true }]}
            >
              <Input type="number" prefix="$" />
            </Form.Item>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true }]}
            >
              <Select>
                <Option value="Pending">Pending</Option>
                <Option value="Completed">Completed</Option>
                <Option value="Cancelled">Cancelled</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="purchaseDate"
              label="Purchase Date"
              rules={[{ required: true }]}
            >
              <DatePicker showTime format="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item name="meals" label="Meals (comma-separated)">
              <Input.TextArea />
            </Form.Item>
            {selectedOrder && selectedOrder.roomNumber && (
              <Form.Item
                name="roomNumber"
                label="Room Number"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            )}
            {selectedOrder && !selectedOrder.roomNumber && (
              <>
                <Form.Item
                  name="phoneNumber"
                  label="Phone Number"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="orderType"
                  label="Order Type"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value="delivery">Delivery</Option>
                    <Option value="takeaway">Takeaway</Option>
                  </Select>
                </Form.Item>
              </>
            )}
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Save
              </Button>
            </Form.Item>
          </Form>
        ) : (
          selectedOrder && (
            <div>
              <p>
                <strong>Order ID:</strong>{" "}
                {selectedOrder.orderId || selectedOrder._id}
              </p>
              <p>
                <strong>Customer Name:</strong> {selectedOrder.customerName}
              </p>
              <p>
                <strong>Amount:</strong> $
                {(
                  Number(selectedOrder.amount) ||
                  Number(selectedOrder.totalAmount) ||
                  0
                ).toFixed(2)}
              </p>
              <p>
                <strong>Status:</strong> {selectedOrder.status}
              </p>
              <p>
                <strong>Purchase Date:</strong>{" "}
                {selectedOrder.purchaseDate
                  ? moment(selectedOrder.purchaseDate).format(
                      "YYYY-MM-DD HH:mm"
                    )
                  : "N/A"}
              </p>
              {selectedOrder.roomNumber && (
                <p>
                  <strong>Room Number:</strong> {selectedOrder.roomNumber}
                </p>
              )}
              {!selectedOrder.roomNumber && (
                <>
                  <p>
                    <strong>Phone Number:</strong> {selectedOrder.phoneNumber}
                  </p>
                  <p>
                    <strong>Order Type:</strong> {selectedOrder.orderType}
                  </p>
                </>
              )}
              {selectedOrder.meals && (
                <div>
                  <h3>Meals</h3>
                  {selectedOrder.meals.map((meal, index) => (
                    <div key={index}>
                      <p>
                        <strong>Name:</strong> {meal.name}
                      </p>
                      {meal.price && (
                        <p>
                          <strong>Price:</strong> ${meal.price.toFixed(2)}
                        </p>
                      )}
                      {meal.specialInstructions && (
                        <p>
                          <strong>Special Instructions:</strong>{" "}
                          {meal.specialInstructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </Modal>
    </Card>
  );
};

export default ComprehensiveAdminDashboard;
