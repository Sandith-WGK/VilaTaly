import React, { useState } from "react";
import { Modal, Calendar, Select, Button, message } from "antd";
import axios from "axios";

const { Option } = Select;

const AttendanceModal = ({ employeeId, visible, onCancel }) => {
  const [date, setDate] = useState(new Date());
  const [status, setStatus] = useState("Present");

  const handleMarkAttendance = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/attendance/markAttendance", {
        employeeId,
        date,
        status,
      });

      // Display success message from the backend
      message.success(response.data.message || "Attendance marked successfully");
      onCancel();
    } catch (error) {
      // Display error message from the backend
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error("Failed to mark attendance");
      }
    }
  };

  return (
    <Modal
      title="Mark Attendance"
      visible={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleMarkAttendance}>
          Submit
        </Button>,
      ]}
    >
      <Calendar fullscreen={false} onSelect={(value) => setDate(value)} />
      <Select
        style={{ width: "100%", marginTop: "16px" }}
        value={status}
        onChange={(value) => setStatus(value)}
      >
        <Option value="Present">Present</Option>
        <Option value="Absent">Absent</Option>
        <Option value="Leave">Leave</Option>
      </Select>
    </Modal>
  );
};

export default AttendanceModal;