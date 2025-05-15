import { BrowserQRCodeReader, NotFoundException } from "@zxing/library";
import { Button, message, Table } from "antd";
import axios from "axios";
import moment from "moment";
import { useEffect, useRef, useState } from "react";

function Attendance({ onAttendanceMarked }) {
    const [scanning, setScanning] = useState(false);
    const [qrData, setQrData] = useState(null);
    const [selectedCameraId, setSelectedCameraId] = useState(null);
    const videoRef = useRef(null);
    const codeReader = useRef(null);

    // Initialize codeReader
    useEffect(() => {
        codeReader.current = new BrowserQRCodeReader();
        return () => stopScanning();
    }, []);

    // Fetch inbuilt camera
    useEffect(() => {
        const fetchCamera = async () => {
            try {
                await navigator.mediaDevices.getUserMedia({ video: true });
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter((device) => device.kind === "videoinput");
                console.log("Video Devices:", videoDevices);

                const inbuiltCamera = videoDevices.find((device) =>
                    device.label.toLowerCase().includes("integrated") ||
                    device.label.toLowerCase().includes("built-in") ||
                    device.label.toLowerCase().includes("webcam")
                );

                if (inbuiltCamera) {
                    console.log("Selected inbuilt camera:", inbuiltCamera.label);
                    setSelectedCameraId(inbuiltCamera.deviceId);
                } else if (videoDevices.length > 0) {
                    console.log("No inbuilt camera, using first camera:", videoDevices[0].label);
                    setSelectedCameraId(videoDevices[0].deviceId);
                } else {
                    message.error("No camera detected");
                }
            } catch (err) {
                console.error("Camera error:", err.message);
                message.error("Failed to access camera");
            }
        };
        fetchCamera();
    }, []);

    // Handle scanning
    useEffect(() => {
        if (!scanning || !selectedCameraId) return;

        const setupVideoStream = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: selectedCameraId } },
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }

                const timeoutId = setTimeout(() => {
                    if (scanning) {
                        message.warning("Scanning timed out");
                        setScanning(false);
                        stopScanning();
                    }
                }, 10000);

                codeReader.current.decodeFromVideoDevice(
                    selectedCameraId,
                    videoRef.current,
                    async (result, err) => {
                        try {
                            if (result) {
                                const data = result.getText();
                                console.log("Scanned QR Data:", data);

                                if (!data || !data.trim()) {
                                    throw new Error("Invalid QR code");
                                }

                                const parsedData = JSON.parse(data);
                                console.log("Parsed QR Data:", parsedData);

                                if (!(parsedData.userID || parsedData.employeeId) || !parsedData.email) {
                                    console.error("Invalid QR data:", parsedData);
                                    throw new Error("QR code missing userID or employeeId, email");
                                }

                                const userID = parsedData.userID || parsedData.employeeId;
                                setQrData({ userID, email: parsedData.email });
                                setScanning(false);
                                stopScanning();
                                clearTimeout(timeoutId);

                                const attendanceData = {
                                    userID,
                                    email: parsedData.email,
                                    date: new Date().toISOString(),
                                    status: "Present",
                                };
                                console.log("Sending attendance:", attendanceData);

                                const response = await axios.post(
                                    "http://localhost:5000/api/user/markAttendance",
                                    attendanceData
                                );
                                console.log("Backend response:", response.data);
                                message.success("Attendance marked");
                                onAttendanceMarked();
                            } else if (err && !(err instanceof NotFoundException)) {
                                console.error("Scan error:", err.message);
                                message.error("Failed to scan QR code");
                                setScanning(false);
                                stopScanning();
                                clearTimeout(timeoutId);
                            }
                        } catch (err) {
                            console.error("QR error:", err.message, "Raw data:", result?.getText());
                            message.error(err.message || "QR scanning error");
                            setScanning(false);
                            stopScanning();
                            clearTimeout(timeoutId);
                        }
                    }
                );
            } catch (err) {
                console.error("Camera access error:", err.message);
                message.error("Failed to access camera");
                setScanning(false);
            }
        };

        setupVideoStream();
        return () => stopScanning();
    }, [scanning, selectedCameraId, onAttendanceMarked]);

    // Stop scanning
    const stopScanning = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
        if (codeReader.current) {
            codeReader.current.reset();
        }
    };

    // Start scanning
    const startScanning = () => {
        if (!selectedCameraId) {
            message.error("No camera available");
            return;
        }
        setScanning(true);
        setQrData(null);
    };

    return (
        <div className="p-4 bg-white rounded shadow max-w-md mx-auto">
            <h2 className="text-lg font-bold mb-4">Mark Attendance</h2>
            {!scanning && !qrData && (
                <Button
                    type="primary"
                    onClick={startScanning}
                    className="bg-blue-600 w-full"
                    disabled={!selectedCameraId}
                >
                    Mark Attendance
                </Button>
            )}
            {scanning && (
                <div className="mb-4 relative">
                    <video ref={videoRef} autoPlay playsInline className="w-full rounded" />
                    <div
                        className="absolute top-0 left-0 w-full h-full"
                        style={{ display: scanning ? "block" : "none" }}
                    >
                        <div
                            className="h-1 bg-red-500 opacity-75"
                            style={{ animation: "scanLine 2s linear infinite" }}
                        />
                    </div>
                    <Button
                        onClick={() => {
                            setScanning(false);
                            stopScanning();
                        }}
                        className="mt-2 bg-gray-500 text-white w-full"
                    >
                        Cancel
                    </Button>
                </div>
            )}
            {qrData && (
                <div className="mt-4 p-4 border rounded">
                    <Button
                        onClick={startScanning}
                        className="mt-4 bg-blue-600 text-white w-full"
                    >
                        Scan Again
                    </Button>
                </div>
            )}
        </div>
    );
}

function AttendancePage() {
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch attendance records
    const fetchAttendanceRecords = async () => {
        try {
            setLoading(true);
            const response = await axios.get("http://localhost:5000/api/user/getAttendance");
            console.log("Attendance Records:", response.data);
            setAttendanceRecords(response.data);
        } catch (err) {
            console.error("Fetch error:", err.message);
            message.error("Failed to fetch records");
        } finally {
            setLoading(false);
        }
    };

    // Fetch records on mount
    useEffect(() => {
        fetchAttendanceRecords();
    }, []);

    // Table columns
    const columns = [
        {
            title: "Employee ID",
            dataIndex: "userID",
            key: "userID",
        },
        {
            title: "Employee Email",
            dataIndex: "email",
            key: "email",
        },
        {
            title: "Date",
            dataIndex: "date",
            key: "date",
            render: (date) => moment(date).format("YYYY-MM-DD"),
        },
        {
            title: "Time",
            dataIndex: "date",
            key: "time",
            render: (date) => moment(date).format("HH:mm:ss"),
        },
    ];

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded shadow p-4 mb-4">
                    <h2 className="text-lg font-semibold mb-4">Scan QR Code</h2>
                    <Attendance onAttendanceMarked={fetchAttendanceRecords} />
                </div>
                <div className="bg-white rounded shadow p-4">
                    <h2 className="text-lg font-semibold mb-4">Attendance Records</h2>
                    <Table
                        columns={columns}
                        dataSource={attendanceRecords}
                        rowKey="_id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                        bordered
                        locale={{ emptyText: "No records" }}
                    />
                </div>
            </div>
        </div>
    );
}

export default AttendancePage;