import React, { useState, useEffect } from "react";
import axios from "axios";
import { Form, Input, Modal, Table, message, Space, Select, DatePicker, InputNumber } from "antd";
import { Icon } from "@iconify/react";
import moment from "moment";
import { Typography } from "antd";
import DiscountReport from "./DiscountReport";

const { Option } = Select;
const { Title, Text } = Typography;

const ManageDiscounts = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteDiscountId, setDeleteDiscountId] = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDiscounts, setFilteredDiscounts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [discountType, setDiscountType] = useState("percentage");
  const [updateDiscountType, setUpdateDiscountType] = useState("percentage");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [discountsResponse, packagesResponse] = await Promise.all([
          axios.get("/api/discount/getDiscounts"),
          axios.get("/api/package/getPackages"),
        ]);

        const fetchedDiscounts = Array.isArray(discountsResponse.data.discounts)
          ? discountsResponse.data.discounts.map(discount => ({
              ...discount,
              applicablePackages: Array.isArray(discount.applicablePackages) 
                ? discount.applicablePackages 
                : []
            }))
          : [];
        const fetchedPackages = Array.isArray(packagesResponse.data.packages)
          ? packagesResponse.data.packages
          : [];

        setDiscounts(fetchedDiscounts);
        setFilteredDiscounts(fetchedDiscounts);
        setPackages(fetchedPackages);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load discounts or packages.");
        setDiscounts([]);
        setFilteredDiscounts([]);
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const disablePastDates = (current) => {
    return current && current < moment().startOf("day");
  };

  useEffect(() => {
    const tempList = discounts.filter(
      (discount) =>
        (discount.name && discount.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (discount.description &&
          discount.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredDiscounts(tempList);
  }, [searchTerm, discounts]);

  const getNextDiscountId = () => {
    if (!discounts || discounts.length === 0) {
      return "DIS-001";
    }

    const existingIds = discounts.map(d => {
      const match = d.discountId?.match(/DIS-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });

    const nextNumber = Math.max(...existingIds) + 1;
    return `DIS-${nextNumber.toString().padStart(3, '0')}`;
  };

  const showModal = () => {
    setIsModalOpen(true);
    form.setFieldsValue({
      discountId: getNextDiscountId(),
      type: "percentage",
    });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setDiscountType("percentage");
  };

  const showUpdateModal = (discount) => {
    setEditingDiscount(discount);
    setIsUpdateModalOpen(true);
    setUpdateDiscountType(discount.type || "percentage");
    updateForm.setFieldsValue({
      discountId: discount.discountId,
      name: discount.name,
      description: discount.description,
      type: discount.type,
      value: discount.value,
      applicablePackages: discount.applicablePackages?.map((pkg) => pkg._id) || [],
      startDate: moment(discount.startDate),
      endDate: moment(discount.endDate),
    });
  };

  const handleUpdateCancel = () => {
    setIsUpdateModalOpen(false);
    updateForm.resetFields();
    setEditingDiscount(null);
    setUpdateDiscountType("percentage");
  };

  const showDeleteModal = (id) => {
    setDeleteDiscountId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDeleteDiscountId(null);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const validateDiscountDateOverlap = async (rule, value) => {
    const selectedPackages = form.getFieldValue("applicablePackages");
    const startDate = form.getFieldValue("startDate");
    const endDate = form.getFieldValue("endDate");

    if (!startDate || !endDate) return Promise.resolve();

    if (selectedPackages && selectedPackages.length > 0) {
      const failedPackages = packages.filter(pkg => {
        if (!pkg.startDate || !pkg.endDate) return false;
        const pkgStart = moment(pkg.startDate).startOf('day');
        const pkgEnd = moment(pkg.endDate).endOf('day');
        return endDate.isBefore(pkgStart) || startDate.isAfter(pkgEnd);
      }).filter(pkg => selectedPackages.includes(pkg._id));

      if (failedPackages.length > 0) {
        return Promise.reject(
          `Selected discount dates do not overlap with the following packages: ${failedPackages.map(pkg => pkg.name).join(", ")}`
        );
      }
    }
    return Promise.resolve();
  };

  const validateDiscountDateOverlapUpdate = async (rule, value) => {
    const selectedPackages = updateForm.getFieldValue("applicablePackages");
    const startDate = updateForm.getFieldValue("startDate");
    const endDate = updateForm.getFieldValue("endDate");

    if (!startDate || !endDate) return Promise.resolve();

    if (selectedPackages && selectedPackages.length > 0) {
      const failedPackages = packages.filter(pkg => {
        if (!pkg.startDate || !pkg.endDate) return false;
        const pkgStart = moment(pkg.startDate).startOf('day');
        const pkgEnd = moment(pkg.endDate).endOf('day');
        return endDate.isBefore(pkgStart) || startDate.isAfter(pkgEnd);
      }).filter(pkg => selectedPackages.includes(pkg._id));

      if (failedPackages.length > 0) {
        return Promise.reject(
          `Selected discount dates do not overlap with the following packages: ${failedPackages.map(pkg => pkg.name).join(", ")}`
        );
      }
    }
    return Promise.resolve();
  };

  const validateDiscountValue = async (rule, value) => {
    if (value === undefined || value <= 0) {
      return Promise.reject("Value must be greater than 0");
    }
    const type = form.getFieldValue("type");
    const applicablePackages = form.getFieldValue("applicablePackages") || [];
    if (type === "fixed") {
      let relevantPackages = applicablePackages.length > 0
        ? packages.filter(pkg => applicablePackages.includes(pkg._id))
        : packages;
      if (relevantPackages.length > 0) {
        const minBasePrice = Math.min(...relevantPackages.map(pkg => pkg.basePrice));
        if (value > minBasePrice) {
          return Promise.reject(
            `Fixed discount value cannot exceed the minimum package price of $${minBasePrice}`
          );
        }
      }
    } else if (type === "percentage" && value > 100) {
      return Promise.reject("Percentage discount cannot exceed 100%");
    }
    return Promise.resolve();
  };

  const validateDiscountValueUpdate = async (rule, value) => {
    if (value === undefined || value <= 0) {
      return Promise.reject("Value must be greater than 0");
    }
    const type = updateForm.getFieldValue("type");
    const applicablePackages = updateForm.getFieldValue("applicablePackages") || [];
    if (type === "fixed") {
      let relevantPackages = applicablePackages.length > 0
        ? packages.filter(pkg => applicablePackages.includes(pkg._id))
        : packages;
      if (relevantPackages.length > 0) {
        const minBasePrice = Math.min(...relevantPackages.map(pkg => pkg.basePrice));
        if (value > minBasePrice) {
          return Promise.reject(
            `Fixed discount value cannot exceed the minimum package price of $${minBasePrice}`
          );
        }
      }
    } else if (type === "percentage" && value > 100) {
      return Promise.reject("Percentage discount cannot exceed 100%");
    }
    return Promise.resolve();
  };

  const addDiscount = async () => {
    try {
      const values = await form.validateFields();
      const discountData = {
        ...values,
        applicablePackages: values.applicablePackages || [],
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
      };

      delete discountData.discountId;

      const response = await axios.post('/api/discount/addDiscount', discountData);
      const completeDiscountResponse = await axios.get(`/api/discount/getDiscount/${response.data.discount._id}`);
      const newDiscount = completeDiscountResponse.data.discount;

      setDiscounts(prevDiscounts => [...prevDiscounts, newDiscount]);
      setFilteredDiscounts(prevFilteredDiscounts => [...prevFilteredDiscounts, newDiscount]);

      setIsModalOpen(false);
      form.resetFields();
      setDiscountType("percentage");
      message.success("Discount added successfully");
    } catch (error) {
      console.error("Error adding discount:", error);
      message.error(error.response?.data?.message || "Failed to add discount");
    }
  };

  const handleUpdate = async () => {
    try {
      const values = await updateForm.validateFields();
      const discountData = {
        ...values,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        applicablePackages: values.applicablePackages || [],
      };

      delete discountData.discountId;

      await axios.put(`/api/discount/updateDiscount/${editingDiscount._id}`, discountData);
      setIsUpdateModalOpen(false);
      message.success("Discount updated successfully");
      const response = await axios.get("/api/discount/getDiscounts");
      const fetchedDiscounts = Array.isArray(response.data.discounts)
        ? response.data.discounts
        : [];
      setDiscounts(fetchedDiscounts);
      setFilteredDiscounts(fetchedDiscounts);
      updateForm.resetFields();
      setUpdateDiscountType("percentage");
    } catch (error) {
      console.error("Error updating discount:", error);
      message.error(error.response?.data?.message || "Failed to update discount");
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/discount/deleteDiscount/${deleteDiscountId}`);
      message.success("Discount deleted successfully");
      setDiscounts(prevDiscounts => prevDiscounts.filter(d => d._id !== deleteDiscountId));
      setFilteredDiscounts(prevFilteredDiscounts => 
        prevFilteredDiscounts.filter(d => d._id !== deleteDiscountId)
      );
      setIsDeleteModalOpen(false);
      setDeleteDiscountId(null);
    } catch (error) {
      console.error("Error deleting discount:", error);
      message.error("Failed to delete discount");
      setIsDeleteModalOpen(false);
      setDeleteDiscountId(null);
    }
  };

  const columns = [
    {
      title: "Discount ID",
      dataIndex: "discountId",
      key: "discountId",
      render: (text) => <span style={{ fontWeight: 'bold' }}>{text || "N/A"}</span>,
    },
    {
      title: "Discount Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <a>{text || "N/A"}</a>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) => text || "N/A",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (text) => text || "N/A",
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      render: (value, record) =>
        value && record.type === "percentage" ? `${value}%` : value ? `$${value}` : "N/A",
    },
    {
      title: "Applicable Packages",
      dataIndex: "applicablePackages",
      key: "applicablePackages",
      render: (packages) =>
        packages && packages.length > 0
          ? packages.map((pkg) => pkg.name).join(", ")
          : "All",
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      render: (date) => (date ? moment(date).format("YYYY-MM-DD") : "N/A"),
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
      render: (date) => (date ? moment(date).format("YYYY-MM-DD") : "N/A"),
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
        <Text>Loading discounts...</Text>
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
    <div className="manage-discounts" style={{ padding: "20px" }}>
      <div className="manage-discounts-content">
        <div className="manage-discounts-header">
          <Title level={1}>Manage Discounts</Title>
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <Input
              type="text"
              placeholder="Search discounts"
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
              Add Discount
            </button>
            <DiscountReport discounts={discounts} packages={packages} />
          </div>
        </div>

        <Modal
          title="Add Discount"
          open={isModalOpen}
          onOk={addDiscount}
          onCancel={handleCancel}
          okText="Add Discount"
          okButtonProps={{ style: { backgroundColor: '#219652', borderColor: '#219652' } }}
        >
          <Form form={form} layout="vertical" initialValues={{ discountId: getNextDiscountId(), type: "percentage" }}>
            <Form.Item
              label="Discount ID"
              name="discountId"
              tooltip="Auto-generated discount ID"
            >
              <Input disabled />
            </Form.Item>
            <Form.Item
              label="Discount Name"
              name="name"
              rules={[{ required: true, message: "Please enter the discount name" }]}
            >
              <Input placeholder="Enter discount name" />
            </Form.Item>
            <Form.Item label="Description" name="description">
              <Input placeholder="Enter description" />
            </Form.Item>
            <Form.Item
              label="Type"
              name="type"
              rules={[{ required: true, message: "Please select a discount type" }]}
            >
              <Select
                placeholder="Select discount type"
                onChange={(value) => setDiscountType(value)}
              >
                <Option value="percentage">Percentage</Option>
                <Option value="fixed">Fixed Amount</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="Value"
              name="value"
              rules={[
                { required: true, message: "Please enter the discount value" },
                { type: "number", message: "Value must be a number" },
                { validator: validateDiscountValue },
              ]}
            >
              <InputNumber
                placeholder="Enter value"
                style={{ width: "100%" }}
                min={0.01}
                step={0.01}
                addonBefore={discountType === "fixed" ? "$" : null}
                addonAfter={discountType === "percentage" ? "%" : null}
              />
            </Form.Item>
            <Form.Item label="Applicable Packages" name="applicablePackages">
              <Select
                mode="multiple"
                placeholder="Select applicable packages (leave empty for all)"
                allowClear
              >
                {packages.map((pkg) => (
                  <Option key={pkg._id} value={pkg._id}>
                    {pkg.name} (Price: ${pkg.basePrice.toFixed(2)}) {pkg.startDate && pkg.endDate ? 
                      `(${moment(pkg.startDate).format('DD.MM.YY')} - ${moment(pkg.endDate).format('DD.MM.YY')})` : ''}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="Start Date"
              name="startDate"
              rules={[{ required: true, message: "Please select a start date" }, { validator: validateDiscountDateOverlap }]}
            >
              <DatePicker
                style={{ width: "100%" }}
                disabledDate={disablePastDates}
                onChange={() => form.validateFields(["endDate", "value"])}
              />
            </Form.Item>
            <Form.Item
              label="End Date"
              name="endDate"
              rules={[{ required: true, message: "Please select an end date" }, { validator: validateDiscountDateOverlap }]}
            >
              <DatePicker
                style={{ width: "100%" }}
                disabledDate={disablePastDates}
                onChange={() => form.validateFields(["startDate", "value"])}
              />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Confirm Delete"
          open={isDeleteModalOpen}
          onOk={confirmDelete}
          onCancel={handleDeleteCancel}
          okText="Delete"
          okButtonProps={{ danger: true }}
          cancelText="Cancel"
        >
          <p>Are you sure you want to delete this discount? This action cannot be undone.</p>
        </Modal>

        <div className="manage-discounts-table" style={{ marginTop: "20px" }}>
          <Table
            columns={columns}
            dataSource={[...filteredDiscounts].sort((a, b) => {
              const numA = parseInt(a.discountId.split('-')[1]);
              const numB = parseInt(b.discountId.split('-')[1]);
              return numA - numB;
            })}
            pagination={{ pageSize: 6 }}
            rowKey="_id"
            bordered
          />
        </div>

        <Modal
          title="Update Discount"
          open={isUpdateModalOpen}
          onOk={handleUpdate}
          onCancel={handleUpdateCancel}
          okText="Update Discount"
          okButtonProps={{ style: { backgroundColor: '#1890ff', borderColor: '#1890ff' } }}
        >
          <Form form={updateForm} layout="vertical">
            <Form.Item
              label="Discount ID"
              name="discountId"
              tooltip="Auto-generated discount ID"
            >
              <Input disabled value={editingDiscount?.discountId || "DIS-XXX"} />
            </Form.Item>
            <Form.Item
              label="Discount Name"
              name="name"
              rules={[{ required: true, message: "Please enter the discount name" }]}
            >
              <Input placeholder="Enter discount name" />
            </Form.Item>
            <Form.Item label="Description" name="description">
              <Input placeholder="Enter description" />
            </Form.Item>
            <Form.Item
              label="Type"
              name="type"
              rules={[{ required: true, message: "Please select a discount type" }]}
            >
              <Select
                placeholder="Select discount type"
                onChange={(value) => setUpdateDiscountType(value)}
              >
                <Option value="percentage">Percentage</Option>
                <Option value="fixed">Fixed Amount</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="Value"
              name="value"
              rules={[
                { required: true, message: "Please enter the discount value" },
                { type: "number", message: "Value must be a number" },
                { validator: validateDiscountValueUpdate },
              ]}
            >
              <InputNumber
                placeholder="Enter value"
                style={{ width: "100%" }}
                min={0.01}
                step={0.01}
                addonBefore={updateDiscountType === "fixed" ? "$" : null}
                addonAfter={updateDiscountType === "percentage" ? "%" : null}
              />
            </Form.Item>
            <Form.Item label="Applicable Packages" name="applicablePackages">
              <Select
                mode="multiple"
                placeholder="Select applicable packages (leave empty for all)"
                allowClear
              >
                {packages.map((pkg) => (
                  <Option key={pkg._id} value={pkg._id}>
                    {pkg.name} (Price: ${pkg.basePrice.toFixed(2)}) {pkg.startDate && pkg.endDate ? 
                      `(${moment(pkg.startDate).format('DD.MM.YY')} - ${moment(pkg.endDate).format('DD.MM.YY')})` : ''}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="Start Date"
              name="startDate"
              rules={[{ required: true, message: "Please select a start date" }, { validator: validateDiscountDateOverlapUpdate }]}
            >
              <DatePicker
                style={{ width: "100%" }}
                disabledDate={disablePastDates}
                onChange={() => updateForm.validateFields(["endDate", "value"])}
              />
            </Form.Item>
            <Form.Item
              label="End Date"
              name="endDate"
              rules={[{ required: true, message: "Please select an end date" }, { validator: validateDiscountDateOverlapUpdate }]}
            >
              <DatePicker
                style={{ width: "100%" }}
                disabledDate={disablePastDates}
                onChange={() => updateForm.validateFields(["startDate", "value"])}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default ManageDiscounts;
