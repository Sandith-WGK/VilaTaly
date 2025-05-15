import { DownloadOutlined, EditOutlined, ExclamationCircleOutlined, PlusOutlined, SearchOutlined, WarningOutlined } from "@ant-design/icons";
import { Alert, Button, DatePicker, Form, Input, InputNumber, message, Modal, Select, Space, Table, Tag } from "antd";
import axios from "axios";
import fileDownload from "js-file-download";
import "jspdf-autotable";
import moment from "moment";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const { Option } = Select;
const { Search } = Input;

const ManageInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [lowStockModalVisible, setLowStockModalVisible] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [expiredItemsModalVisible, setExpiredItemsModalVisible] = useState(false);
  const [expiredItems, setExpiredItems] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(0);
  const [orderSupplier, setOrderSupplier] = useState("");
  const [orderPrice, setOrderPrice] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  const perItemPrice = Form.useWatch("perItemPrice", form);
  const stockQuantity = Form.useWatch("stockQuantity", form);
  const liveTotalPrice = (perItemPrice || 0) * (stockQuantity || 0);

  useEffect(() => {
    setTotalPrice(orderQuantity * orderPrice);
  }, [orderQuantity, orderPrice]);

  const showOrderForm = (item) => {
    setSelectedItem(item);
    const defaultQty = Math.max(1, item.reorderLevel - item.stockQuantity);
    setOrderQuantity(defaultQty);
    setOrderSupplier(item.supplier);
    setOrderPrice(item.perItemPrice || 0);
    setOrderModalVisible(true);
  };

  const handleOrderSubmit = async () => {
    try {
      await axios.post(`http://localhost:5000/api/inventory/orderStock/${selectedItem._id}`, {
        quantity: orderQuantity,
        supplier: orderSupplier,
      });
      message.success("Stock ordered successfully");
      setOrderModalVisible(false);
      fetchInventory();
      checkLowStock();
    } catch (error) {
      console.error("Order failed:", error);
      message.error("Failed to place order");
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://localhost:5000/api/inventory/getItems");
      if (!response.data) throw new Error("No data received from server");
      setInventory(response.data);
      setFilteredInventory(response.data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setError(error.message || "Failed to fetch inventory items");
      message.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    if (searchText.trim() === "") {
      setFilteredInventory(inventory);
    } else {
      const filtered = inventory.filter((item) =>
        Object.values(item).some(
          (val) => val && val.toString().toLowerCase().includes(searchText.toLowerCase())
        )
      );
      setFilteredInventory(filtered);
    }
  }, [searchText, inventory]);

  const showModal = (item = null) => {
    setEditingItem(item);
    setModalVisible(true);
    if (item) {
      form.setFieldsValue({
        ...item,
        purchaseDate: moment(item.purchaseDate),
        expirationDate: moment(item.expirationDate),
      });
    } else {
      const nextIdNumber = inventory.length + 1;
      const generatedId = `INV-${nextIdNumber.toString().padStart(3, "0")}`;
      form.setFieldsValue({ itemID: generatedId });
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      values.purchaseDate = values.purchaseDate ? values.purchaseDate.format("YYYY-MM-DD") : moment().format("YYYY-MM-DD");
      values.expirationDate = values.expirationDate ? values.expirationDate.format("YYYY-MM-DD") : moment().add(1, "year").format("YYYY-MM-DD");
      if (editingItem) {
        await axios.put(`http://localhost:5000/api/inventory/updateItem/${editingItem._id}`, values);
        message.success("Inventory item updated successfully");
      } else {
        await axios.post("http://localhost:5000/api/inventory/addItem", values);
        message.success("Inventory item added successfully");
      }
      setModalVisible(false);
      form.resetFields();
      await fetchInventory();
    } catch (error) {
      console.error("Operation failed:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      message.error(`Operation failed: ${errorMessage}`);
    }
  };

  const handleDelete = async (itemID) => {
    let password = "";
    Modal.confirm({
      title: "Enter Admin Password to Delete Item",
      icon: <ExclamationCircleOutlined />,
      content: <Input.Password placeholder="Enter password" onChange={(e) => (password = e.target.value)} />,
      okText: "Confirm Delete",
      cancelText: "Cancel",
      onOk: async () => {
        if (password === "admin123") {
          try {
            await axios.delete(`http://localhost:5000/api/inventory/deleteItem/${itemID}`);
            message.success("Item deleted successfully");
            await fetchInventory();
          } catch (error) {
            console.error("Delete failed:", error);
            message.error("Failed to delete item: " + (error.response?.data?.error || error.message));
          }
        } else {
          message.error("Incorrect password. Deletion aborted.");
        }
      },
    });
  };

  const safeToString = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number") return value.toString();
    if (value instanceof Date) return moment(value).format("YYYY-MM-DD");
    if (typeof value === "object" && value.props) {
      return value.props.children?.toString() || "";
    }
    return value.toString();
  };

  const downloadPDF = async (data, columns, filename, lowStockItems = [], expiredItems = []) => {
    try {
      const jsPDF = window.jspdf.jsPDF;
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Green theme colors
      const primaryColor = [39, 174, 97]; // #27ae61
      const secondaryColor = [107, 114, 128]; // gray-500
      const accentColor = [229, 231, 235]; // gray-200

      // Load logo (assumes logo.png is in public/)
      const logoUrl = "/logo.png";
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = logoUrl;
      await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load logo image"));
      });
      doc.addImage(img, "PNG", 20, 15, 20, 20); // Top-left corner

      // Header
      doc.setFontSize(18);
      doc.setTextColor(...primaryColor);
      doc.setFont("helvetica", "bold");
      doc.text("Inventory Report", 50, 20); // Adjusted for logo

      doc.setFontSize(10);
      doc.setTextColor(...secondaryColor);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${moment().format("YYYY-MM-DD HH:mm:ss")}`, 50, 28);

      // Horizontal line
      doc.setLineWidth(0.5);
      doc.setDrawColor(...primaryColor);
      doc.line(20, 45, 190, 45);

      // Summary Statistics
      const totalValue = data.reduce((sum, item) => sum + (item.perItemPrice || 0) * (item.stockQuantity || 0), 0);
      doc.setFontSize(12);
      doc.setTextColor(...primaryColor);
      doc.text("Summary", 20, 55);
      doc.setFontSize(10);
      doc.setTextColor(...secondaryColor);
      doc.text(`Total Items: ${data.length}`, 20, 62);

      // Check for empty data
      if (data.length === 0) {
        doc.setFontSize(10);
        doc.setTextColor(...secondaryColor);
        doc.text("No data available to display.", 20, 90);
        doc.save(filename);
        message.warning("PDF generated with no data.");
        return;
      }

      // Table
      const tableHeaders = columns.map((col) => col.title);
      const tableData = data.map((item) =>
        columns.map((col) => {
          const value = col.render ? col.render(item[col.dataIndex], item) : item[col.dataIndex];
          const stringValue = safeToString(value);
          return stringValue.length > 50 ? stringValue.substring(0, 47) + "..." : stringValue;
        })
      );

      doc.autoTable({
        head: [tableHeaders],
        body: tableData,
        startY: 85,
        theme: "grid",
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 8,
          textColor: secondaryColor,
        },
        alternateRowStyles: {
          fillColor: accentColor,
        },
        styles: {
          cellPadding: 2,
          overflow: "linebreak",
        },
        columnStyles: {
          0: { cellWidth: 20 }, // Item ID
          1: { cellWidth: 30 }, // Name
          2: { cellWidth: 15 }, // Stock Quantity
          3: { cellWidth: 15 }, // Status
          4: { cellWidth: 20 }, // Purchase Date
          5: { cellWidth: 20 }, // Expiration Date
          6: { cellWidth: 25 }, // Supplier
        },
        margin: { top: 85, left: 20, right: 20 },
        didDrawPage: (data) => {
          const pageCount = doc.internal.getNumberOfPages();
          const pageHeight = doc.internal.pageSize.height;
          doc.setFontSize(8);
          doc.setTextColor(...secondaryColor);
          doc.text(`Page ${data.pageNumber} of ${pageCount}`, 190, pageHeight - 10, { align: "right" });
          doc.text("Contact: info@acmecorp.com | +1-234-567-8900", 20, pageHeight - 10);
        },
      });

      doc.save(filename);
      message.success(`${filename} downloaded successfully`);
    } catch (error) {
      console.error("PDF download failed:", error);
      message.error(`Failed to generate PDF file: ${error.message}`);
    }
  };

  const checkLowStock = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/inventory/checkLowStock");
      if (response.data.length > 0) {
        setLowStockItems(response.data);
        setLowStockModalVisible(true);
      } else {
        message.success("All items are sufficiently stocked.");
      }
    } catch (error) {
      console.error("Low stock check failed:", error);
      message.error("Failed to check low stock: " + error.message);
    }
  };

  const checkExpiredItems = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/inventory/checkExpiredItems");
      if (response.data.length > 0) {
        setExpiredItems(response.data);
        setExpiredItemsModalVisible(true);
      } else {
        message.success("No expired items found.");
      }
    } catch (error) {
      console.error("Expired items check failed:", error);
      message.error("Failed to check expired items: " + error.message);
    }
  };

  const convertToCSV = (data, columns) => {
    const headers = columns.map((col) => `"${col.title}"`).join(",");
    const rows = data.map((item) =>
      columns
        .map((col) => {
          const value = col.render ? col.render(item[col.dataIndex], item) : item[col.dataIndex];
          return `"${safeToString(value)}"`;
        })
        .join(",")
    );
    return [headers, ...rows].join("\n");
  };

  const downloadCSV = (data, columns, filename) => {
    try {
      const csvData = convertToCSV(data, columns);
      fileDownload(csvData, filename);
      message.success(`${filename} downloaded successfully`);
    } catch (error) {
      console.error("CSV download failed:", error);
      message.error("Failed to generate CSV file");
    }
  };

  const downloadAllProductsCSV = () => {
    const columns = [
      { title: "Item ID", dataIndex: "itemID" },
      { title: "Name", dataIndex: "name" },
      { title: "Category", dataIndex: "category" },
      { title: "Type", dataIndex: "type" },
      { title: "Stock Quantity", dataIndex: "stockQuantity" },
      { title: "Unit", dataIndex: "unit" },
      { title: "Status", dataIndex: "status", render: (status) => status },
      { title: "Purchase Date", dataIndex: "purchaseDate", render: (date) => moment(date).format("YYYY-MM-DD") },
      { title: "Expiration Date", dataIndex: "expirationDate", render: (date) => moment(date).format("YYYY-MM-DD") },
      { title: "Supplier", dataIndex: "supplier" },
    ];
    downloadCSV(inventory, columns, "inventory_export.csv");
  };

  const downloadAllProductsPDF = () => {
    const columns = [
      { title: "Item ID", dataIndex: "itemID" },
      { title: "Name", dataIndex: "name" },
      { title: "Stock Quantity", dataIndex: "stockQuantity" },
      { title: "Status", dataIndex: "status", render: (status) => status },
      { title: "Purchase Date", dataIndex: "purchaseDate", render: (date) => moment(date).format("YYYY-MM-DD") },
      { title: "Expiration Date", dataIndex: "expirationDate", render: (date) => moment(date).format("YYYY-MM-DD") },
      { title: "Supplier", dataIndex: "supplier" },
    ];
    downloadPDF(inventory, columns, "inventory_export.pdf", lowStockItems, expiredItems);
  };

  const columns = [
    { title: "Item ID", dataIndex: "itemID", key: "itemID", sorter: (a, b) => a.itemID.localeCompare(b.itemID) },
    { title: "Name", dataIndex: "name", key: "name", sorter: (a, b) => a.name.localeCompare(b.name) },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      filters: [
        { text: "Fruits", value: "fruits" },
        { text: "Vegetables", value: "vegetables" },
        { text: "Dairy", value: "dairy" },
        { text: "Meat", value: "meat" },
        { text: "Beverages", value: "beverages" },
        { text: "Dry Goods", value: "dry-goods" },
        { text: "Frozen", value: "frozen" },
      ],
      onFilter: (value, record) => record.category === value,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      filters: [
        { text: "Perishable", value: "Perishable" },
        { text: "Non-Perishable", value: "Non-Perishable" },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: "Quantity",
      dataIndex: "stockQuantity",
      key: "stockQuantity",
      sorter: (a, b) => a.stockQuantity - b.stockQuantity,
      render: (quantity, record) => (
        <span className={quantity < record.minStockLevel ? "text-red-600 font-bold" : ""}>
          {quantity} {record.unit}
          {quantity < record.minStockLevel && <WarningOutlined className="ml-1 text-red-600" />}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Active", value: "Active" },
        { text: "Inactive", value: "Inactive" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <Tag color={status === "Active" ? "green" : "red"}>{status}</Tag>
      ),
    },
    {
      title: "Expiration",
      key: "expiration",
      render: (_, record) => (
        moment(record.expirationDate).isBefore(moment()) ? (
          <Tag color="orange">Expired</Tag>
        ) : (
          <Tag color="blue">Valid</Tag>
        )
      ),
      filters: [
        { text: "Valid", value: "valid" },
        { text: "Expired", value: "expired" },
      ],
      onFilter: (value, record) =>
        value === "expired"
          ? moment(record.expirationDate).isBefore(moment())
          : !moment(record.expirationDate).isBefore(moment()),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
            title="Edit"
            size="small"
            className="bg-[#27ae61] text-white hover:bg-[#1e8c4d]"
          />
          {/* <Button
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
            danger
            title="Delete"
            size="small"
          /> */}
        </Space>
      ),
    },
  ];

  // Prepare chart data with minStockLevel
  const chartData = (selectedCategory === "all"
    ? filteredInventory
    : filteredInventory.filter((item) => item.category === selectedCategory)
  ).map((item) => ({
    name: item.name,
    stockQuantity: item.stockQuantity,
    minStockLevel: item.minStockLevel || 0,
  }));

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Manage Inventory</h1>
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          className="mb-2"
        />
      )}
      <div className="flex justify-between mb-2">
        <Space size="small">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
            className="bg-[#27ae61] hover:bg-[#1e8c4d]"
            size="small"
          >
            Add Item
          </Button>
          <Button
            type="primary"
            onClick={checkLowStock}
            icon={<WarningOutlined />}
            className="bg-[#27ae61] hover:bg-[#1e8c4d]"
            size="small"
          >
            Reorder
          </Button>
          <Button
            type="primary"
            onClick={checkExpiredItems}
            icon={<ExclamationCircleOutlined />}
            className="bg-[#27ae61] hover:bg-[#1e8c4d]"
            size="small"
          >
            Expired
          </Button>
        </Space>
        <Space size="small">
          <Search
            placeholder="Search inventory..."
            allowClear
            enterButton={
              <Button
                type="primary"
                className="bg-[#27ae61] hover:bg-[#1e8c4d]"
                size="small"
              >
                <SearchOutlined />
              </Button>
            }
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-48"
            size="small"
          />
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={downloadAllProductsCSV}
            className="bg-red-600 hover:bg-red-700"
            size="small"
          >
            Export CSV
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={downloadAllProductsPDF}
            className="bg-red-600 hover:bg-red-700"
            size="small"
          >
            Export PDF
          </Button>
        </Space>
      </div>
      <Table
        columns={columns}
        dataSource={filteredInventory}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
        bordered
        size="small"
        className="mb-4"
      />
      <Modal
        title={editingItem ? "Edit Item" : "Add Item"}
        visible={modalVisible}
        onOk={handleSubmit}
        onCancel={handleModalCancel}
        okText={editingItem ? "Update" : "Add"}
        cancelText="Cancel"
        width={600}
        destroyOnClose
        okButtonProps={{ className: "bg-[#27ae61] hover:bg-[#1e8c4d]" }}
        cancelButtonProps={{ className: "bg-gray-300 hover:bg-gray-400" }}
      >
        <Form form={form} layout="vertical" size="small">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="itemID"
              label="Item ID"
              rules={[{ required: true, message: "Required" }, { max: 20, message: "Max 20 chars" }]}
            >
              <Input placeholder="INV-001" disabled className="h-7" />
            </Form.Item>
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: "Required" }, { max: 50, message: "Max 50 chars" }]}
            >
              <Input placeholder="Item Name" className="h-7" />
            </Form.Item>
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: "Required" }]}
            >
              <Select placeholder="Select category" disabled={!!editingItem} className="h-7">
                <Option value="fruits">Fruits</Option>
                <Option value="vegetables">Vegetables</Option>
                <Option value="dairy">Dairy</Option>
                <Option value="meat">Meat</Option>
                <Option value="beverages">Beverages</Option>
                <Option value="dry-goods">Dry Goods</Option>
                <Option value="frozen">Frozen</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="type"
              label="Type"
              rules={[{ required: true, message: "Required" }]}
            >
              <Select placeholder="Select type" disabled={!!editingItem} className="h-7">
                <Option value="Perishable">Perishable</Option>
                <Option value="Non-Perishable">Non-Perishable</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="stockQuantity"
              label="Quantity"
              rules={[{ required: true, message: "Required" }, { type: "number", min: 0, message: "Must be positive" }]}
            >
              <InputNumber className="w-full h-7" min={0} disabled={!!editingItem} />
            </Form.Item>
            <Form.Item
              name="unit"
              label="Unit"
              rules={[{ required: true, message: "Required" }, { max: 10, message: "Max 10 chars" }]}
            >
              <Input placeholder="kg, g, L" disabled={!!editingItem} className="h-7" />
            </Form.Item>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: "Required" }]}
            >
              <Select placeholder="Select status" className="h-7">
                <Option value="Active">Active</Option>
                <Option value="Inactive">Inactive</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="purchaseDate"
              label="Purchase Date"
            >
              <DatePicker
                className="w-full h-7"
                defaultValue={moment()}
                disabledDate={(current) => current && current.format("YYYY-MM-DD") !== moment().format("YYYY-MM-DD")}
                disabled
              />
            </Form.Item>
            <Form.Item
              name="expirationDate"
              label="Expiration Date"
              rules={[{ required: true, message: "Required" }]}
            >
              <DatePicker
                className="w-full h-7"
                disabledDate={(current) => current && current < moment().startOf("day")}
              />
            </Form.Item>
            <Form.Item
              name="supplier"
              label="Supplier"
              rules={[{ required: true, message: "Required" }, { max: 100, message: "Max 100 chars" }]}
            >
              <Input placeholder="Supplier Name" disabled={!!editingItem} className="h-7" />
            </Form.Item>
            <Form.Item
              name="minStockLevel"
              label="Reorder Level"
              rules={[{ required: true, message: "Required" }, { type: "number", min: 0, message: "Must be 0 or more" }]}
            >
              <InputNumber className="w-full h-7" min={0} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
      <Modal
        title="Low Stock Items"
        visible={lowStockModalVisible}
        onCancel={() => setLowStockModalVisible(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setLowStockModalVisible(false)}
            size="small"
            className="bg-gray-300 hover:bg-gray-400"
          >
            Close
          </Button>,
          // <Button
          //   key="download"
          //   type="primary"
          //   icon={<DownloadOutlined />}
          //   onClick={downloadLowStockCSV}
          //   size="small"
          //   className="bg-red-600 hover:bg-red-700"
          // >
          //   Export CSV
          // </Button>,
        ]}
        width={700}
      >
        <Table
          columns={[
            { title: "Item ID", dataIndex: "itemID" },
            { title: "Name", dataIndex: "name" },
            {
              title: "Current Stock",
              dataIndex: "stockQuantity",
              render: (quantity, record) => (
                <span className="text-red-600 font-bold">
                  {quantity} {record.unit}
                </span>
              ),
            },
            {
              title: "Action",
              render: (_, record) => (
                <Button
                  type="primary"
                  onClick={() => showOrderForm(record)}
                  size="small"
                  className="bg-[#27ae61] hover:bg-[#1e8c4d]"
                >
                  Reorder
                </Button>
              ),
            },
          ]}
          dataSource={lowStockItems}
          rowKey="_id"
          pagination={false}
          bordered
          size="small"
        />
      </Modal>
      <Modal
        title={`Order Stock - ${selectedItem?.name}`}
        visible={orderModalVisible}
        onCancel={() => setOrderModalVisible(false)}
        onOk={handleOrderSubmit}
        okText="Confirm Order"
        okButtonProps={{
          type: "primary",
          className: "bg-[#27ae61] hover:bg-[#1e8c4d]"
        }}
        cancelButtonProps={{ className: "bg-gray-300 hover:bg-gray-400" }}
        width={400}
      >
        <Form layout="vertical" size="small">
          <Form.Item label="Order Quantity" required>
            <InputNumber
              min={1}
              value={orderQuantity}
              onChange={(val) => setOrderQuantity(val || 1)}
              className="w-full h-7"
            />
          </Form.Item>
          <Form.Item label="Supplier" required>
            <Input
              value={orderSupplier}
              onChange={(e) => setOrderSupplier(e.target.value)}
              className="h-7"
            />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Expired Items"
        visible={expiredItemsModalVisible}
        onCancel={() => setExpiredItemsModalVisible(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setExpiredItemsModalVisible(false)}
            size="small"
            className="bg-gray-300 hover:bg-gray-400"
          >
            Close
          </Button>,
          // <Button
          //   key="download"
          //   type="primary"
          //   icon={<DownloadOutlined />}
          //   onClick={downloadExpiredItemsCSV}
          //   size="small"
          //   className="bg-red-600 hover:bg-red-700"
          // >
          //   Export CSV
          // </Button>,
        ]}
        width={600}
      >
        <Table
          columns={[
            { title: "Item ID", dataIndex: "itemID" },
            { title: "Name", dataIndex: "name" },
            {
              title: "Expiration Date",
              dataIndex: "expirationDate",
              render: (date) => (
                <span className="text-orange-600 font-bold">
                  {moment(date).format("YYYY-MM-DD")}
                </span>
              ),
            },
            {
              title: "Days Expired",
              render: (_, record) => (
                <span className="text-orange-600 font-bold">
                  {moment().diff(moment(record.expirationDate), "days")} days
                </span>
              ),
            },
          ]}
          dataSource={expiredItems}
          rowKey="_id"
          pagination={false}
          bordered
          size="small"
        />
      </Modal>
      <div className="mt-5">
        <h2 className="text-xl font-semibold mb-2">📊 Inventory Analytics</h2>
        <h5 className="text-sm text-gray-600 mb-2">Stock Quantity by Item</h5>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              formatter={(value, name, props) => [
                value,
                name === "stockQuantity" ? "Stock Quantity" : "Reorder Level",
              ]}
            />
            <Bar dataKey="stockQuantity" fill="#27ae61">
              <LabelList
                dataKey="minStockLevel"
                position="top"
                fill="#ff0000"
                fontSize={10}
                formatter={(value) => (value > 0 ? `Reorder: ${value}` : "")}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ManageInventory;