import React, { useState, useEffect } from 'react';
import { Table, Input, Button, message, Modal, Form, Select, InputNumber, Image } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import fileDownload from 'js-file-download'; // Import the file download package

const { Search } = Input;
const { Option } = Select;

const ManageCateringFoods = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/catering/getItems');
      setFoods(response.data || []);
    } catch (error) {
      message.error('Failed to fetch foods');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    // Implement search functionality
  };

  const showModal = (food = null) => {
    setEditingFood(food);
    setModalVisible(true);
    if (food) {
      form.setFieldsValue(food);
    } else {
      form.resetFields();
    }
  };

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      try {
        if (editingFood) {
          await axios.post('http://localhost:5000/api/catering/updateItem', { ...values, itemId: editingFood.itemId });
          message.success('Food item updated successfully');
        } else {
          await axios.post('http://localhost:5000/api/catering/addItem', values);
          message.success('Food item added successfully');
        }
        setModalVisible(false);
        fetchFoods();
      } catch (error) {
        message.error('Operation failed: ' + (error.response?.data?.error || error.message));
      }
    });
  };

  const handleDelete = async (itemId) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this food item?',
      onOk: async () => {
        try {
          await axios.post('http://localhost:5000/api/catering/deleteItem', { itemId });
          message.success('Food item deleted successfully');
          fetchFoods();
        } catch (error) {
          message.error('Failed to delete food item');
        }
      },
    });
  };

  // CSV Export Function
  const exportToCSV = () => {
    const csvData = foods.map((food) => ({
      ItemID: food.itemId,
      Name: food.name,
      Description: food.description,
      Price: `$${food.price.toFixed(2)}`,
      Category: food.category,
      Type: food.type,
      ImageURL: food.imageUrl,
    }));

    const csvContent = [
      ["ItemID", "Name", "Description", "Price", "Category", "Type", "ImageURL"],
      ...csvData.map((item) =>
        [item.ItemID, item.Name, item.Description, item.Price, item.Category, item.Type, item.ImageURL]
      ),
    ]
      .map((e) => e.join(","))
      .join("\n");

    fileDownload(csvContent, 'catering_foods_report.csv');
  };

  const columns = [
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      render: (text) => <Image src={text} alt="food" width={100} />,
    },
    { title: 'Item ID', dataIndex: 'itemId', key: 'itemId' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'Price', dataIndex: 'price', key: 'price', render: (price) => `$${price.toFixed(2)}` },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <>
          <Button icon={<EditOutlined />} onClick={() => showModal(record)} />
          <Button icon={<DeleteOutlined />} onClick={() => handleDelete(record.itemId)} danger />
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1>Manage Catering Foods</h1>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <Search
          placeholder="Search foods"
          onSearch={handleSearch}
          style={{ width: 300 }}
          enterButton
        />
        <div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
            style={{ marginRight: 10 }}
          >
            Add New Food
          </Button>
          <Button
            type="default"
            icon={<DownloadOutlined />}
            onClick={exportToCSV}
          >
            Export CSV
          </Button>
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={foods}
        rowKey="itemId"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title={editingFood ? 'Edit Food Item' : 'Add New Food Item'}
        visible={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="imageUrl" label="Image URL">
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="price" label="Price" rules={[{ required: true, type: 'number', min: 0.01 }]}>
            <InputNumber style={{ width: '100%' }} step={0.01} />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select>
              <Option value="vegi">Veg</Option>
              <Option value="non vegi">Non-Veg</Option>
            </Select>
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select>
              <Option value="breakfast">Breakfast</Option>
              <Option value="lunch">Lunch</Option>
              <Option value="dinner">Dinner</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageCateringFoods;
