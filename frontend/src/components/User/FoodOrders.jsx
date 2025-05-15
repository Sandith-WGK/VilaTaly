import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Input, message, Table } from "antd";
import moment from "moment"; // Import moment for date formatting

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch orders data
  const getOrders = async () => {
    try {
      const response = await axios.get("/api/order/getOrders");
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      const filteredOrders = response.data.orders.filter(
        (order) => order.userID === currentUser.userID
      );
      setOrders(filteredOrders);
    } catch (error) {
      console.log(error);
    }
  };

  // Delete order function
  const deleteOrder = async (orderId) => {
    try {
      await axios.delete(`/api/order/deleteOrder/${orderId}`);
      message.success("Order deleted successfully");
      getOrders(); // Refresh orders after deletion
    } catch (error) {
      console.log(error);
      message.error("Failed to delete order");
    }
  };

  // Handle edit button click
  const handleEdit = (order) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
    form.setFieldsValue({
      orderId: order.orderId,
      amount: order.amount,
      status: order.status,
      purchaseDate: moment(order.purchaseDate), // Set moment date
    });
  };

  // Handle modal cancel
  const handleCancel = () => {
    setIsEditModalOpen(false);
  };

  // Handle form submission for editing order
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await axios.put(`/api/order/updateOrder/${selectedOrder.orderId}`, {
        orderId: values.orderId,
        amount: values.amount,
        status: values.status,
        purchaseDate: values.purchaseDate.format("YYYY-MM-DD"), // Format date
      });
      message.success("Order updated successfully");
      setIsEditModalOpen(false);
      getOrders(); // Refresh orders after update
    } catch (error) {
      console.log(error);
      message.error("Failed to update order");
    }
  };

  // Pagination
  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);

  // Change page
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Fetch orders when the component mounts
  useEffect(() => {
    getOrders();
  }, []);

  // Define columns for the table
  const columns = [
    {
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Purchase Date",
      dataIndex: "purchaseDate",
      key: "purchaseDate",
      render: (text) => moment(text).format("YYYY-MM-DD"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (text, order) => (
        <div className="card-buttons">
          <Button type="primary" onClick={() => handleEdit(order)}>
            Edit
          </Button>
          <Button type="danger" onClick={() => deleteOrder(order._id)}>
            Cancel
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="orders-container">
      <h2>Your Orders</h2>
      {orders.length === 0 ? (
        <p>No orders found</p>
      ) : (
        <>
          <Table
            dataSource={currentOrders}
            columns={columns}
            pagination={false}
            rowKey="_id"
          />
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
              disabled={indexOfLastOrder >= orders.length}
            >
              Next
            </Button>
          </div>
        </>
      )}

      {/* Edit Order Modal */}
      <Modal
        title="Edit Order"
        open={isEditModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Update"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Order ID"
            name="orderId"
            rules={[{ required: true, message: "Please enter order ID" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Amount"
            name="amount"
            rules={[{ required: true, message: "Please enter amount" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: "Please enter status" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Purchase Date"
            name="purchaseDate"
            rules={[{ required: true, message: "Please select purchase date" }]}
          >
            <Input type="text" disabled />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default OrderHistory;
