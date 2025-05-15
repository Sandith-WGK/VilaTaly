import React, { useState, useEffect } from "react";
import { Space, Table, Modal, Input, Form, Select, InputNumber, message, Button, DatePicker } from "antd";
import { Icon } from "@iconify/react";
import axios from "axios";
import { Typography } from "antd";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { DownloadOutlined } from "@ant-design/icons";
import moment from "moment";
import logo from '../../assets/Logo/logo-white.png';

const { Title, Text } = Typography;
const { Option } = Select;

// Predefined list of features
const AVAILABLE_FEATURES = [
  "WiFi",
  "Breakfast",
  "Air Conditioning",
  "Mini Bar",
  "Room Service",
  "Parking",
  "Gym Access",
  "Spa Access",
  "Ocean View",
  "Balcony",
  "TV",
  "Coffee Maker",
  "Swimming Pool"
];

const ManagePackages = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isRoomTypeModalOpen, setIsRoomTypeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePackageId, setDeletePackageId] = useState(null);
  const [packages, setPackages] = useState([]);
  const [editingPackage, setEditingPackage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [roomTypeForm] = Form.useForm();
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [isUpdatingPackage, setIsUpdatingPackage] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [packagesResponse, roomTypesResponse] = await Promise.all([
          axios.get("/api/package/getPackages"),
          axios.get("/api/package/getRoomTypes"),
        ]);

        const fetchedPackages = Array.isArray(packagesResponse.data.packages)
          ? packagesResponse.data.packages.map(pkg => ({
              ...pkg,
              features: Array.isArray(pkg.features) 
                ? pkg.features 
                : (typeof pkg.features === 'string' 
                    ? JSON.parse(pkg.features) 
                    : [])
            }))
          : [];
        const fetchedRoomTypes = Array.isArray(roomTypesResponse.data.roomTypes)
          ? roomTypesResponse.data.roomTypes
          : [];

        setPackages(fetchedPackages);
        setFilteredPackages(fetchedPackages);
        setRoomTypes(fetchedRoomTypes);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load packages or room types.");
        setPackages([]);
        setFilteredPackages([]);
        setRoomTypes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const tempList = packages.filter(
      (pkg) =>
        (pkg.name && pkg.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (pkg.roomType?.name &&
          pkg.roomType.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (pkg.features &&
          pkg.features.some((feature) =>
            feature.toLowerCase().includes(searchTerm.toLowerCase())
          ))
    );
    setFilteredPackages(tempList);
  }, [searchTerm, packages]);

  // Function to get next available package ID
  const getNextPackageId = () => {
    if (!packages || packages.length === 0) {
      return "PKG-001";
    }

    // Get all existing package IDs and extract their numbers
    const existingIds = packages.map(p => {
      const match = p.packageId?.match(/PKG-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });

    // Find the highest number and add 1
    const nextNumber = Math.max(...existingIds) + 1;
    
    // Format the number with leading zeros
    return `PKG-${nextNumber.toString().padStart(3, '0')}`;
  };

  const showModal = () => {
    setIsModalOpen(true);
    form.setFieldsValue({
      packageId: getNextPackageId()
    });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setImageFile(null);
    setPreviewUrl(null);
  };

  // Disable past dates
  const disablePastDates = (current) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return current && current.toDate() < today;
  };

  // Add validation for dates
  const validateDates = (_, value) => {
    const startDate = form.getFieldValue('startDate');
    const endDate = form.getFieldValue('endDate');
    
    if (startDate && endDate && startDate.toDate() > endDate.toDate()) {
      return Promise.reject('End date must be after start date');
    }
    return Promise.resolve();
  };

  // Add validation for dates in update form
  const validateUpdateDates = (_, value) => {
    const startDate = updateForm.getFieldValue('startDate');
    const endDate = updateForm.getFieldValue('endDate');
    
    if (startDate && endDate && startDate.toDate() > endDate.toDate()) {
      return Promise.reject('End date must be after start date');
    }
    return Promise.resolve();
  };

  const showUpdateModal = (pkg) => {
    setEditingPackage(pkg);
    setIsUpdateModalOpen(true);
    setPreviewUrl(pkg.image || null);
    let featuresValue = pkg.features;
    if (!Array.isArray(featuresValue)) {
      featuresValue = [];
    }
    updateForm.setFieldsValue({
      packageId: pkg.packageId,
      name: pkg.name,
      roomType: pkg.roomType?._id,
      basePrice: pkg.basePrice,
      capacity: pkg.capacity,
      features: featuresValue,
      startDate: pkg.startDate ? moment(pkg.startDate) : null,
      endDate: pkg.endDate ? moment(pkg.endDate) : null,
    });
  };

  const handleUpdateCancel = () => {
    setIsUpdateModalOpen(false);
    updateForm.resetFields();
    setEditingPackage(null);
    setImageFile(null);
    setPreviewUrl(null);
  };

  const showRoomTypeModal = () => setIsRoomTypeModalOpen(true);
  const handleRoomTypeCancel = () => {
    setIsRoomTypeModalOpen(false);
    roomTypeForm.resetFields();
  };

  const showDeleteModal = (id) => {
    setDeletePackageId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDeletePackageId(null);
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addPackage = async () => {
    try {
      setIsAddingPackage(true);
      const values = await form.validateFields();
      const formData = new FormData();
      
      // Remove packageId from formData as it will be auto-generated by the backend
      const { packageId, ...packageData } = values;
      
      Object.keys(packageData).forEach(key => {
        if (key === 'features') {
          values[key].forEach(f => formData.append('features', f));
        } else {
          formData.append(key, values[key]);
        }
      });
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      await axios.post("/api/package/addPackage", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setIsModalOpen(false);
      message.success("Package added successfully");
      const response = await axios.get("/api/package/getPackages");
      const fetchedPackages = Array.isArray(response.data.packages) ? response.data.packages : [];
      setPackages(fetchedPackages);
      setFilteredPackages(fetchedPackages);
      form.resetFields();
      setImageFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Error adding package:", error);
      message.error(error.response?.data?.message || "Failed to add package");
    } finally {
      setIsAddingPackage(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setIsUpdatingPackage(true);
      const values = await updateForm.validateFields();
      const formData = new FormData();
      Object.keys(values).forEach(key => {
        if (key === 'features') {
          values[key].forEach(f => formData.append('features', f));
        } else {
          formData.append(key, values[key]);
        }
      });
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (editingPackage.image) {
        formData.append('image', editingPackage.image);
      }
      await axios.put(`/api/package/updatePackage/${editingPackage._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setIsUpdateModalOpen(false);
      message.success("Package updated successfully");
      const response = await axios.get("/api/package/getPackages");
      const fetchedPackages = Array.isArray(response.data.packages) ? response.data.packages : [];
      setPackages(fetchedPackages);
      setFilteredPackages(fetchedPackages);
      updateForm.resetFields();
      setImageFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Error updating package:", error);
      message.error(error.response?.data?.message || "Failed to update package");
    } finally {
      setIsUpdatingPackage(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/package/deletePackage/${deletePackageId}`);
      message.success("Package deleted successfully");
      const response = await axios.get("/api/package/getPackages");
      const fetchedPackages = Array.isArray(response.data.packages) ? response.data.packages.map(pkg => ({
        ...pkg,
        features: Array.isArray(pkg.features) ? pkg.features : (pkg.features ? JSON.parse(pkg.features) : [])
      })) : [];
      setPackages(fetchedPackages);
      setFilteredPackages(fetchedPackages);
      setIsDeleteModalOpen(false);
      setDeletePackageId(null);
    } catch (error) {
      console.error("Error deleting package:", error);
      message.error("Failed to delete package");
      setIsDeleteModalOpen(false);
      setDeletePackageId(null);
    }
  };

  const addRoomType = async () => {
    try {
      const values = await roomTypeForm.validateFields();
      console.log("Sending room type data:", values);
      const response = await axios.post("/api/package/addRoomType", values);
      console.log("Room type response:", response.data);
      setIsRoomTypeModalOpen(false);
      message.success("Room type added successfully");
      const roomTypesResponse = await axios.get("/api/package/getRoomTypes");
      const fetchedRoomTypes = Array.isArray(roomTypesResponse.data.roomTypes)
        ? roomTypesResponse.data.roomTypes
        : [];
      console.log("Fetched room types after adding:", fetchedRoomTypes);
      setRoomTypes(fetchedRoomTypes);
      roomTypeForm.resetFields();
    } catch (error) {
      console.error("Error adding room type:", error);
      message.error(error.response?.data?.message || "Failed to add room type");
    }
  };

  // PDF Generation Function
  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add logo to the top right corner
      const imgWidth = 30; // Adjust size as needed
      const imgHeight = 30; // Adjust size as needed
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.addImage(logo, 'PNG', pageWidth - imgWidth - 14, 12, imgWidth, imgHeight);
      
      // Add title with green color and bold
      doc.setFontSize(24);
      doc.setTextColor(33, 150, 83); // RGB values for a nice green color
      doc.setFont(undefined, 'bold'); // Set font to bold
      doc.text('Packages List', 14, 25);
      doc.setFont(undefined, 'normal'); // Reset font to normal
      doc.setTextColor(0, 0, 0); // Reset text color to black for rest of the content
      
      // Add report generation info
      doc.setFontSize(10);
      doc.text(`Generated on: ${moment().format('MMMM D, YYYY [at] h:mm A')}`, 14, 38);
      
      const tableColumns = [
        "Package Name", 
        "Room Type", 
        "Base Price ($)", 
        "Capacity", 
        "Start Date",
        "End Date",
        "Features"
      ];
      
      const tableRows = filteredPackages.map(pkg => [
        pkg.name || "N/A",
        pkg.roomType?.name || "N/A",
        pkg.basePrice?.toString() || "N/A",
        `${pkg.capacity || "N/A"} guests`,
        pkg.startDate ? moment(pkg.startDate).format("MMM D, YYYY") : "N/A",
        pkg.endDate ? moment(pkg.endDate).format("MMM D, YYYY") : "N/A",
        Array.isArray(pkg.features) ? pkg.features.join(", ") : "None"
      ]);
      
      doc.autoTable({
        head: [tableColumns],
        body: tableRows,
        startY: 45,
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [33, 150, 83]
        }
      });
      
      doc.save("packages-list.pdf");
      message.success("PDF generated successfully");
    } catch (error) {
      console.error("PDF generation error:", error);
      message.error("Failed to generate PDF");
    }
  };

  const columns = [
    { 
      title: "Package ID", 
      dataIndex: "packageId", 
      key: "packageId",
      render: (text) => <span style={{ fontWeight: 'bold' }}>{text}</span>
    },
    { title: "Package Name", dataIndex: "name", key: "name", render: (text) => <a>{text}</a> },
    { title: "Room Type", dataIndex: ["roomType", "name"], key: "roomType", render: (name) => name || "N/A" },
    { title: "Base Price", dataIndex: "basePrice", key: "basePrice", render: (price) => `$${price || "N/A"}` },
    { title: "Capacity", dataIndex: "capacity", key: "capacity", render: (capacity) => `${capacity || "N/A"} guests` },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      render: (date) => date ? moment(date).format("MMM D, YYYY") : "N/A"
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
      render: (date) => date ? moment(date).format("MMM D, YYYY") : "N/A"
    },
    {
      title: "Features",
      dataIndex: "features",
      key: "features",
      render: (features) => Array.isArray(features) ? features.join(", ") : features || "None",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Icon 
            onClick={() => showUpdateModal(record)} 
            icon="akar-icons:edit" 
            width="24" 
            height="24" 
            style={{ cursor: "pointer", color: "#1890ff" }} 
          />
          <Icon 
            onClick={() => showDeleteModal(record._id)} 
            icon="material-symbols:delete" 
            width="24" 
            height="24" 
            style={{ cursor: "pointer", color: "#ff4d4f" }} 
          />
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <Text>Loading packages...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <Text type="danger">{error}</Text>
      </div>
    );
  }

  return (
    <div className="manage-packages" style={{ padding: "20px" }}>
      <div className="manage-packages-content">
        <div className="manage-packages-header">
          <Title level={1}>Manage Packages</Title>
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <Input
              type="text"
              placeholder="Search packages"
              value={searchTerm}
              onChange={handleSearchChange}
              style={{ width: 300, height: 40 }}
            />
            <button
              onClick={showModal}
              style={{ 
                backgroundColor: "#219652", 
                color: "white", 
                border: "none", 
                padding: "10px 20px", 
                borderRadius: "4px", 
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Add Package
            </button>
            <button
              onClick={showRoomTypeModal}
              style={{ 
                backgroundColor: "#1e88e5", 
                color: "white", 
                border: "none", 
                padding: "10px 20px", 
                borderRadius: "4px", 
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Add Room Type
            </button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={generatePDF}
              style={{ 
                backgroundColor: "#f5222d", 
                borderColor: "#f5222d"
              }}
            >
              Export PDF
            </Button>
          </div>
        </div>

        {/* Add Package Modal */}
        <Modal 
          title="Add Package" 
          open={isModalOpen} 
          onOk={addPackage} 
          onCancel={handleCancel}
          okText="Add Package"
          okButtonProps={{ 
            style: { backgroundColor: '#219652', borderColor: '#219652' },
            loading: isAddingPackage
          }}
          confirmLoading={isAddingPackage}
        >
          <Form form={form} layout="vertical" initialValues={{ packageId: getNextPackageId() }}>
            <Form.Item 
              label="Package ID" 
              name="packageId"
              tooltip="Auto-generated package ID"
            >
              <Input disabled />
            </Form.Item>
            <Form.Item 
              label="Package Name" 
              name="name" 
              rules={[{ required: true, message: "Please enter the package name" }]}
            >
              <Input placeholder="Enter package name" />
            </Form.Item>
            <Form.Item 
              label="Room Type" 
              name="roomType" 
              rules={[{ required: true, message: "Please select a room type" }]}
            >
              <Select placeholder="Select room type">
                {roomTypes.map((type) => (
                  <Option key={type._id} value={type._id}>
                    {type.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item 
              label="Base Price (Per Night)" 
              name="basePrice" 
              rules={[
                { required: true, message: "Please enter the base price" },
                { type: "number", message: "Base price must be a number" },
                {
                  validator: (_, value) => {
                    if (value === undefined || value <= 0) {
                      return Promise.reject("Base price must be greater than 0");
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <InputNumber 
                placeholder="Enter base price Ex: $100.00" 
                style={{ width: "100%" }} 
                min={0.01}
                step={0.01}
                addonBefore="$"
              />
            </Form.Item>
            <Form.Item 
              label="Capacity" 
              name="capacity" 
              rules={[
                { required: true, message: "Please enter the capacity" },
                { type: "number", message: "Capacity must be a number" },
                {
                  validator: (_, value) => {
                    if (value === undefined || value <= 0 || !Number.isInteger(value)) {
                      return Promise.reject("Capacity must be a positive integer");
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <InputNumber 
                placeholder="Enter capacity" 
                style={{ width: "100%" }} 
                min={1}
                precision={0}
              />
            </Form.Item>
            <Form.Item 
              label="Features" 
              name="features" 
              rules={[{ required: true, message: "Please select at least one feature" }]}
            >
              <Select
                mode="multiple"
                placeholder="Select features"
                allowClear
                style={{ width: "100%" }}
              >
                {AVAILABLE_FEATURES.map((feature) => (
                  <Option key={feature} value={feature}>
                    {feature}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item 
              label="Start Date"
              name="startDate"
              rules={[
                { required: true, message: "Please select a start date" },
                { validator: validateDates }
              ]}
            >
              <DatePicker
                style={{ width: "100%" }}
                disabledDate={disablePastDates}
                onChange={() => form.validateFields(['endDate'])}
                format="YYYY-MM-DD"
              />
            </Form.Item>
            <Form.Item
              label="End Date"
              name="endDate"
              rules={[
                { required: true, message: "Please select an end date" },
                { validator: validateDates }
              ]}
            >
              <DatePicker
                style={{ width: "100%" }}
                disabledDate={disablePastDates}
                onChange={() => form.validateFields(['startDate'])}
                format="YYYY-MM-DD"
              />
            </Form.Item>
            <Form.Item 
              label="Package Image" 
              name="image"
            >
              <Input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
              />
              {previewUrl && (
                <div style={{ marginTop: '10px' }}>
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    style={{ maxWidth: '200px', maxHeight: '200px' }} 
                  />
                </div>
              )}
            </Form.Item>
          </Form>
        </Modal>

        {/* Add Room Type Modal */}
        <Modal 
          title="Add Room Type" 
          open={isRoomTypeModalOpen} 
          onOk={addRoomType} 
          onCancel={handleRoomTypeCancel}
          okText="Add Room Type"
          okButtonProps={{ style: { backgroundColor: '#1e88e5', borderColor: '#1e88e5' } }}
        >
          <Form form={roomTypeForm} layout="vertical">
            <Form.Item 
              label="Room Type Name" 
              name="name" 
              rules={[{ required: true, message: "Please enter the room type name" }]}
            >
              <Input placeholder="Enter room type name" />
            </Form.Item>
            <Form.Item 
              label="Total Rooms" 
              name="totalRooms" 
              rules={[
                { required: true, message: "Please enter the total number of rooms" },
                { type: "number", message: "Total rooms must be a number" },
                {
                  validator: (_, value) => {
                    if (value && (isNaN(value) || value < 1 || !Number.isInteger(value))) {
                      return Promise.reject("Please enter a valid positive integer");
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <InputNumber 
                placeholder="Enter total rooms" 
                style={{ width: "100%" }} 
                min={1}
                precision={0}
              />
            </Form.Item>
            <Form.Item label="Description" name="description">
              <Input placeholder="Enter description (optional)" />
            </Form.Item>
          </Form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          title="Confirm Delete"
          open={isDeleteModalOpen}
          onOk={confirmDelete}
          onCancel={handleDeleteCancel}
          okText="Delete"
          okButtonProps={{ danger: true }}
          cancelText="Cancel"
        >
          <p>Are you sure you want to delete this package? This action cannot be undone.</p>
        </Modal>

        <div className="manage-packages-table" style={{ marginTop: "20px" }}>
          <Table 
            columns={columns} 
            dataSource={filteredPackages.sort((a, b) => {
              // Extract numbers from packageId (e.g., "PKG-001" -> 1)
              const numA = parseInt(a.packageId.split('-')[1]);
              const numB = parseInt(b.packageId.split('-')[1]);
              return numA - numB;
            })} 
            pagination={{ pageSize: 6 }} 
            rowKey="_id" 
            bordered
          />
        </div>

        {/* Update Package Modal */}
        <Modal 
          title="Update Package" 
          open={isUpdateModalOpen} 
          onOk={handleUpdate} 
          onCancel={handleUpdateCancel}
          okText="Update Package"
          okButtonProps={{ 
            style: { backgroundColor: '#1890ff', borderColor: '#1890ff' },
            loading: isUpdatingPackage
          }}
          confirmLoading={isUpdatingPackage}
        >
          <Form form={updateForm} layout="vertical">
            <Form.Item 
              label="Package ID" 
              name="packageId"
              tooltip="Auto-generated package ID"
            >
              <Input disabled value={editingPackage?.packageId} />
            </Form.Item>
            <Form.Item 
              label="Package Name" 
              name="name" 
              rules={[{ required: true, message: "Please enter the package name" }]}
            >
              <Input placeholder="Enter package name" />
            </Form.Item>
            <Form.Item 
              label="Room Type" 
              name="roomType" 
              rules={[{ required: true, message: "Please select a room type" }]}
            >
              <Select placeholder="Select room type" disabled>
                {roomTypes.map((type) => (
                  <Option key={type._id} value={type._id}>
                    {type.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item 
              label="Base Price (Per Night)" 
              name="basePrice" 
              rules={[
                { required: true, message: "Please enter the base price" },
                { type: "number", message: "Base price must be a number" },
                {
                  validator: (_, value) => {
                    if (value === undefined || value <= 0) {
                      return Promise.reject("Base price must be greater than 0");
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <InputNumber 
                placeholder="Enter base price" 
                style={{ width: "100%" }} 
                min={0.01}
                step={0.01}
                addonBefore="$"
              />
            </Form.Item>
            <Form.Item 
              label="Capacity" 
              name="capacity" 
              rules={[
                { required: true, message: "Please enter the capacity" },
                { type: "number", message: "Capacity must be a number" },
                {
                  validator: (_, value) => {
                    if (value === undefined || value <= 0 || !Number.isInteger(value)) {
                      return Promise.reject("Capacity must be a positive integer");
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <InputNumber 
                placeholder="Enter capacity" 
                style={{ width: "100%" }} 
                min={1}
                precision={0}
              />
            </Form.Item>
            <Form.Item 
              label="Features" 
              name="features" 
              rules={[{ required: true, message: "Please select at least one feature" }]}
            >
              <Select
                mode="multiple"
                placeholder="Select features"
                allowClear
                style={{ width: "100%" }}
              >
                {AVAILABLE_FEATURES.map((feature) => (
                  <Option key={feature} value={feature}>
                    {feature}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item 
              label="Start Date"
              name="startDate"
              rules={[
                { required: true, message: "Please select a start date" },
                { validator: validateUpdateDates }
              ]}
            >
              <DatePicker
                style={{ width: "100%" }}
                disabled
                format="YYYY-MM-DD"
              />
            </Form.Item>
            <Form.Item
              label="End Date"
              name="endDate"
              rules={[
                { required: true, message: "Please select an end date" },
                { validator: validateUpdateDates }
              ]}
            >
              <DatePicker
                style={{ width: "100%" }}
                disabledDate={disablePastDates}
                onChange={() => updateForm.validateFields(['startDate'])}
                format="YYYY-MM-DD"
              />
            </Form.Item>
            <Form.Item 
              label="Package Image"
            >
              <Input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
              />
              {previewUrl && (
                <div style={{ marginTop: '10px' }}>
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    style={{ maxWidth: '200px', maxHeight: '200px' }} 
                  />
                </div>
              )}
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default ManagePackages;