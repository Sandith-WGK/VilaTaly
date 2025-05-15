import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  MinusOutlined,
  PlusOutlined as PlusIcon,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from "antd";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import AttendanceModal from "./AttendanceModal";

const { Title, Text } = Typography;
const { Option } = Select;

function ManageEmployees() {
  const [employees, setEmployees] = useState([]);
  const [employeeNames, setEmployeeNames] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form] = Form.useForm();
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [downloadFormat, setDownloadFormat] = useState("csv");
  const qrCodeRef = useRef(null);

  useEffect(() => {
    fetchEmployees();
    fetchEmployeeNames();
  }, []);

  // Generate QR code synchronously
  const generateQrCode = () => {
    const userID = form.getFieldValue("userID") || "";
    const email = form.getFieldValue("email") || "";

    if (!userID || !email) {
      console.log("Cannot generate QR code: userID or email is empty", { userID, email });
      return "";
    }

    const qrData = JSON.stringify({ userID, email });
    console.log("Generating QR code with:", qrData);

    if (qrCodeRef.current) {
      const canvas = qrCodeRef.current.querySelector("canvas");
      if (canvas) {
        const dataUrl = canvas.toDataURL("image/png");
        console.log("QR code data URL:", dataUrl.substring(0, 50) + "...");
        form.setFieldsValue({ qrCode: dataUrl });
        return dataUrl;
      } else {
        console.error("QR code canvas not found");
      }
    } else {
      console.error("QR code ref not found");
    }
    return "";
  };

  // Fetch all employees for the table
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/employee/getEmployees");
      setEmployees(response.data || []);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      message.error("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  // Fetch employee names for the dropdown (only Customers)
  const fetchEmployeeNames = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/employee/getCustomerNames");
      console.log("Fetched employee names:", response.data);
      setEmployeeNames(response.data || []);
    } catch (error) {
      console.error("Failed to fetch employee names:", error);
      message.error("Failed to fetch employee names");
    }
  };

  // Handle employee selection from the dropdown
  const handleEmployeeSelect = (value) => {
    const selectedEmployee = employeeNames.find((emp) => emp.userID === value);
    if (selectedEmployee) {
      form.setFieldsValue({
        userID: selectedEmployee.userID,
        firstName: selectedEmployee.firstName,
        lastName: selectedEmployee.lastName,
        email: selectedEmployee.email,
        username: selectedEmployee.username,
        qrCode: "", // Reset qrCode initially
      });
      console.log("Employee selected:", selectedEmployee);
      generateQrCode(); // Generate QR code after setting form values
    }
  };

  // Handle image upload
  const handleUploadChange = ({ file, fileList }) => {
    setFileList(fileList.slice(-1)); // Keep only the latest file

    if (file.status === "done" || file.status === "uploading") {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result;
        form.setFieldsValue({ imageUrl: base64String });
        console.log("Image converted to Base64:", base64String.substring(0, 50) + "...");
      };
      reader.onerror = () => {
        message.error("Failed to read image file");
      };
      reader.readAsDataURL(file.originFileObj);
    } else if (file.status === "error") {
      message.error("Image upload failed");
    }
  };

  // Validate image before upload
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("You can only upload image files!");
      return Upload.LIST_IGNORE;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("Image must be smaller than 5MB!");
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  // Update tasksCompleted for an employee
  const updateTasksCompleted = async (employeeId, newValue) => {
    try {
      const employee = employees.find((emp) => emp.employeeId === employeeId);
      if (!employee) {
        throw new Error("Employee not found");
      }

      // Update backend
      await axios.put(`http://localhost:5000/api/employee/${employeeId}`, {
        ...employee,
        tasksCompleted: newValue,
      });

      // Update local state
      setEmployees((prevEmployees) =>
        prevEmployees.map((emp) =>
          emp.employeeId === employeeId ? { ...emp, tasksCompleted: newValue } : emp
        )
      );

      message.success("Star Points updated successfully");
    } catch (error) {
      console.error("Failed to update Star Points:", error);
      message.error("Failed to update Star Points");
    }
  };

  // Handle form submission
  const handleAddEdit = async (values) => {
    try {
      console.log("Form values:", values);

      // Validate userID and email
      if (!values.userID || !values.email) {
        message.error("Please select a valid employee with userID and email.");
        return;
      }

      // Generate QR code if missing
      const qrCode = values.qrCode || generateQrCode();
      if (!qrCode) {
        message.error("Failed to generate QR code. Please try again.");
        return;
      }

      // Validate imageUrl for new employees
      if (!editingEmployee && !values.imageUrl) {
        message.error("Please upload an image.");
        return;
      }

      const employeeData = {
        ...values,
        imageUrl: values.imageUrl || "",
        qrCode,
      };

      if (editingEmployee) {
        // Update the employee
        await axios.put(
          `http://localhost:5000/api/employee/${editingEmployee.employeeId}`,
          employeeData
        );
        message.success("Employee updated successfully");
      } else {
        // Add a new employee
        const nextIdNumber = employees.length + 1;
        employeeData.employeeId = `EMP-${nextIdNumber.toString().padStart(3, "0")}`;
        const response = await axios.post("http://localhost:5000/api/employee/addEmployee", employeeData);
        console.log("Add employee response:", response.data);
        message.success("Employee added successfully");
      }

      // Refresh the table and dropdown data
      await fetchEmployees();
      await fetchEmployeeNames();

      // Reset form and file list
      form.resetFields();
      setFileList([]);
      setIsModalVisible(false);
      setEditingEmployee(null);
    } catch (error) {
      console.error("Error in handleAddEdit:", error);
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error("Failed to save employee");
      }
    }
  };

  // Handle delete employee
  const handleDelete = async (employeeId) => {
    try {
      const employee = employees.find((emp) => emp.employeeId === employeeId);
      if (!employee) {
        throw new Error("Employee not found");
      }
      await axios.post("http://localhost:5000/api/employee/deleteEmployee", {
        employeeId,
      });
      console.log("Changing role for userID:", employee.userID);
      const roleResponse = await axios.post(
        "http://localhost:5000/api/user/changeRoleDeleteEmployee",
        { userID: employee.userID }
      );
      console.log("Role change response:", roleResponse.data);
      message.success("Employee deleted successfully");
      fetchEmployees();
      fetchEmployeeNames();
    } catch (error) {
      console.error("Error in handleDelete:", error);
      message.error("Failed to delete employee");
    }
  };

  // Show modal for adding/editing an employee
  const showModal = (employee = null) => {
    setEditingEmployee(employee);
    if (employee) {
      form.setFieldsValue(employee);
      setFileList(
        employee.imageUrl
          ? [
            {
              uid: "-1",
              name: "current-image",
              status: "done",
              url: employee.imageUrl,
            },
          ]
          : []
      );
      generateQrCode();
    } else {
      form.resetFields();
      form.setFieldsValue({ qrCode: "" });
      setFileList([]);
    }
    setIsModalVisible(true);
  };

  // Handle marking attendance
  const handleMarkAttendance = (employeeId) => {
    setSelectedEmployeeId(employeeId);
    setAttendanceModalVisible(true);
  };

  // Download CSV for all employees
  const downloadCSV = () => {
    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Username",
      "Department",
      "Star Points",
      "Recent Achievement",
    ];

    const csvData = employees.map((employee) => [
      employee.firstName,
      employee.lastName,
      employee.email,
      employee.username,
      employee.department,
      employee.tasksCompleted,
      employee.recentAchievement,
    ]);

    let csvString = `${headers.join(",")}\n`;
    csvData.forEach((row) => {
      csvString += `${row.join(",")}\n`;
    });

    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "employees.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download attendance as CSV or PDF
  const downloadAttendance = async (employeeId = null) => {
    try {
      const url = employeeId
        ? `http://localhost:5000/api/user/getAttendance/${employeeId}`
        : "http://localhost:5000/api/user/getAttendance";
      const response = await axios.get(url);

      const headers = ["Employee ID", "Employee Email", "Date", "Time"];
      const csvData = response.data.map((attendance) => [
        attendance.userID,
        attendance.email,
        new Date(attendance.date).toLocaleDateString(),
        new Date(attendance.date).toLocaleTimeString(),
      ]);

      if (downloadFormat === "csv") {
        let csvString = `${headers.join(",")}\n`;
        csvData.forEach((row) => {
          csvString += `${row.join(",")}\n`;
        });

        const blob = new Blob([csvString], { type: "text/csv" });
        const urlObject = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.setAttribute("hidden", "");
        a.setAttribute("href", urlObject);
        a.setAttribute(
          "download",
          employeeId ? "employee_attendance.csv" : "all_employees_attendance.csv"
        );
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        message.success("Attendance CSV downloaded successfully");
      } else if (downloadFormat === "pdf") {
        const doc = new jsPDF();
        doc.text("Attendance Report", 14, 20);
        doc.autoTable({
          startY: 30,
          head: [headers],
          body: csvData,
          theme: "grid",
          styles: { fontSize: 10, cellPadding: 2 },
          headStyles: { fillColor: [22, 160, 133] },
        });
        doc.save(employeeId ? "employee_attendance.pdf" : "all_employees_attendance.pdf");
        message.success("Attendance PDF downloaded successfully");
      }
    } catch (error) {
      console.error("Failed to download attendance data:", error);
      message.error("Failed to download attendance data");
    }
  };

  // Sort employees by tasksCompleted in descending order
  const sortedEmployees = employees
    .filter((employee) =>
      `${employee.firstName} ${employee.lastName} ${employee.email} ${employee.username}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.tasksCompleted - a.tasksCompleted);

  const columns = [
    {
      title: "Employee",
      key: "employee",
      render: (_, record) => (
        <Space>
          <Avatar src={record.imageUrl || undefined} icon={<UserOutlined />} />
          <span>
            {record.firstName} {record.lastName}
          </span>
        </Space>
      ),
    },
    {
      title: "Emp. ID",
      dataIndex: "userID",
      key: "userID",
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (department) => <Tag color="blue">{department}</Tag>,
    },
    {
      title: "Star Points",
      dataIndex: "tasksCompleted",
      key: "tasksCompleted",
      render: (tasks, employee) => (
        <Space>
          <Button
            type="text"
            icon={<MinusOutlined />}
            onClick={() => updateTasksCompleted(employee.employeeId, Math.max(0, tasks - 1))}
          />
          <Text strong>{tasks}</Text>
          <Button
            type="text"
            icon={<PlusIcon />}
            onClick={() => updateTasksCompleted(employee.employeeId, tasks + 1)}
          />
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, employee) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              onClick={() => showModal(employee)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Are you sure you want to delete this employee?"
              onConfirm={() => handleDelete(employee.employeeId)}
              okText="Yes"
              cancelText="No"
            >
              <Button icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="manage-employees" style={{ padding: "24px" }}>
      <Card
        title={<Title level={4}>Existing Employees</Title>}
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add New Employee
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={downloadCSV}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Download Emp. Details
            </Button>
            <Select
              defaultValue="csv"
              style={{ width: 100 }}
              onChange={(value) => setDownloadFormat(value)}
            >
              <Option value="csv">CSV</Option>
              <Option value="pdf">PDF</Option>
            </Select>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => downloadAttendance()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Download All Attendance
            </Button>
          </Space>
        }
        style={{ marginTop: "24px" }}
      >
        <Input.Search
          placeholder="Search employees"
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={(value) => setSearchTerm(value)}
          style={{ marginBottom: 16 }}
        />

        <Table
          loading={loading}
          dataSource={sortedEmployees}
          columns={columns}
          rowKey="employeeId"
        />
      </Card>
      <Modal
        title={
          <Title level={4}>
            {editingEmployee ? "Edit Employee" : "Add New Employee"}
          </Title>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setFileList([]);
        }}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleAddEdit} layout="vertical">
          <Form.Item
            name="userID"
            label="Select Employee"
            rules={[{ required: true, message: "Please select an employee" }]}
          >
            <Select
              showSearch
              placeholder="Select an employee"
              optionFilterProp="children"
              onChange={handleEmployeeSelect}
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              disabled={editingEmployee}
            >
              {employeeNames.map((employee) => (
                <Option key={employee.userID} value={employee.userID}>
                  {employee.firstName} {employee.lastName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="imageUrl"
            label="Profile Picture"
            rules={[{ required: !editingEmployee, message: "Please upload an image" }]}
          >
            <Upload
              fileList={fileList}
              onChange={handleUploadChange}
              beforeUpload={beforeUpload}
              accept="image/*"
              listType="picture"
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Upload Image</Button>
            </Upload>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true }]}
              >
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true }]}
              >
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input disabled />
          </Form.Item>
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true }]}
          >
            <Input disabled />
          </Form.Item>
          <Form.Item
            name="department"
            label="Department"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select a department">
              <Option value="Guest Service">Guest Service</Option>
              <Option value="House Keeping">House Keeping</Option>
              <Option value="Food & Beverage">Food & Beverage</Option>
              <Option value="Maintenance & Security">Maintenance & Security</Option>
              <Option value="Accounts & Finance">Accounts & Finance</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="tasksCompleted"
            label="Star Points"
            rules={[{ required: true, message: "Please enter Star Points" }]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              addonBefore={<Button type="text" onClick={() => form.setFieldsValue({ tasksCompleted: Math.max(0, (form.getFieldValue("tasksCompleted") || 0) - 1) })}>-</Button>}
              addonAfter={<Button type="text" onClick={() => form.setFieldsValue({ tasksCompleted: (form.getFieldValue("tasksCompleted") || 0) + 1 })}>+</Button>}
            />
          </Form.Item>
          <Form.Item name="recentAchievement" label="Description">
            <Input.TextArea rows={4} />
          </Form.Item>
          <div style={{ display: "none" }}>
            <div ref={qrCodeRef}>
              <QRCodeCanvas
                value={JSON.stringify({
                  userID: form.getFieldValue("userID") || "",
                  email: form.getFieldValue("email") || "",
                })}
                size={150}
              />
            </div>
          </div>
          <Form.Item>
            <Button type="primary" htmlType="submit" block className="bg-blue-600 hover:bg-blue-700">
              {editingEmployee ? "Update" : "Add"} Employee
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <AttendanceModal
        employeeId={selectedEmployeeId}
        open={attendanceModalVisible}
        onCancel={() => setAttendanceModalVisible(false)}
      />
    </div>
  );
}

export default ManageEmployees;