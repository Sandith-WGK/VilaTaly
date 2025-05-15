import React, { useEffect, useState } from "react";
import { Table, Button, Space, Typography } from "antd";
import axios from "axios";
import { CSVLink } from "react-csv";
import { AiFillPrinter, AiOutlineFilePdf, AiOutlineFileExcel } from "react-icons/ai";
import jsPDF from "jspdf";
import "jspdf-autotable";
import logo from '../../assets/Logo/logo-white.png';

const { Title } = Typography;

function ManageFeedbacks() {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [allFeedbacks, setAllFeedbacks] = useState([]);
    const limit = 7;

    useEffect(() => {
        fetchFeedbacks(page);
        fetchAllFeedbacks();
    }, [page]);

    const fetchFeedbacks = async (page) => {
        setLoading(true);
        try {
            const response = await axios.post("/api/feedback/getFeedback", { page, limit });
            setFeedbacks(response.data.feedbacks);
            setTotal(response.data.total);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching feedbacks:", error);
            setLoading(false);
        }
    };

    const fetchAllFeedbacks = async () => {
        try {
            const response = await axios.post("/api/feedback/getFeedback", { page: 1, limit: 0 });
            setAllFeedbacks(response.data.feedbacks);
        } catch (error) {
            console.error("Error fetching all feedbacks:", error);
        }
    };

    const generateFeedbackId = (feedback) => {
        const year = new Date(feedback.createdAt).getFullYear();
        // Get last 4 digits of MongoDB ID and pad with zeros if needed
        const sequence = feedback._id.slice(-4).toUpperCase();
        return `FB-${year}-${sequence}`;
    };

    // Function to generate and download PDF report
    const generatePDFReport = () => {
        // Create a new PDF document
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
        doc.text("Feedback Management Report", 14, 25);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0); // Reset text color to black
        
        // Add report generation info
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 38);
        
        // Summary Section
        let yPos = 48;
        doc.setFontSize(11);
        doc.text('Summary:', 14, yPos);
        yPos += 6;

        const summaryTable = [
            ['Total Feedbacks', allFeedbacks.length],
            ['Average Rating', (allFeedbacks.reduce((sum, feedback) => sum + (feedback.rating || 0), 0) / allFeedbacks.length).toFixed(1)],
            ['Total Likes', allFeedbacks.reduce((sum, feedback) => sum + (feedback.likes || 0), 0)],
            ['Total Dislikes', allFeedbacks.reduce((sum, feedback) => sum + (feedback.dislikes || 0), 0)]
        ];

        doc.autoTable({
            head: [['Metric', 'Value']],
            body: summaryTable,
            startY: yPos,
            headStyles: { fillColor: [33, 150, 83] },
            margin: { left: 14 },
            columnStyles: {
                0: { cellWidth: 70 },
                1: { cellWidth: 30 }
            }
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // Rating Distribution Section
        doc.setFontSize(11);
        doc.text('Rating Distribution:', 14, yPos);
        yPos += 6;

        const ratingCounts = allFeedbacks.reduce((acc, feedback) => {
            const rating = feedback.rating || 0;
            acc[rating] = (acc[rating] || 0) + 1;
            return acc;
        }, {});

        const ratingTable = Object.entries(ratingCounts).map(([rating, count]) => [
            `${rating} Stars`,
            count,
            `${((count / allFeedbacks.length) * 100).toFixed(1)}%`
        ]);

        doc.autoTable({
            head: [['Rating', 'Count', 'Percentage']],
            body: ratingTable,
            startY: yPos,
            headStyles: { fillColor: [33, 150, 83] },
            margin: { left: 14 }
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // Detailed Feedback Table
        doc.setFontSize(11);
        doc.text('Detailed Feedback List:', 14, yPos);
        yPos += 6;

        const tableData = allFeedbacks.map(feedback => [
            generateFeedbackId(feedback),
            feedback.title,
            feedback.username,
            feedback.rating,
            feedback.description.length > 25 ? feedback.description.substring(0, 25) + "..." : feedback.description,
            new Date(feedback.createdAt).toLocaleString()
        ]);

        doc.autoTable({
            head: [["Feedback ID", "Title", "Username", "Rating", "Description", "Date"]],
            body: tableData,
            startY: yPos,
            headStyles: { fillColor: [33, 150, 83] },
            margin: { left: 14 },
            styles: { fontSize: 8, cellPadding: 2 },
            alternateRowStyles: { fillColor: [240, 240, 240] },
            didDrawPage: (data) => {
                doc.setFontSize(10);
                const pageSize = doc.internal.pageSize;
                const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                doc.text('Page ' + data.pageNumber, data.settings.margin.left, pageHeight - 10);
            }
        });
        
        // Save the PDF
        doc.save("feedback-report.pdf");
    };

    const columns = [
        {
            title: "Feedback ID",
            dataIndex: "_id",
            key: "_id",
            render: (text, record) => generateFeedbackId(record),
        },
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
        },
        {
            title: "Username",
            dataIndex: "username",
            key: "username",
        },
        {
            title: "User ID",
            dataIndex: "userID",
            key: "userID",
            render: (text, record) => (
                record.username === 'Anonymous' ? 'Hidden' : text
            ),
        },
        {
            title: "Rating",
            dataIndex: "rating",
            key: "rating",
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            render: (text) => (
                text.length > 30 ? `${text.substring(0, 30)}...` : text
            ),
        },
        {
            title: "Timestamp",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (text) => new Date(text).toLocaleString(),
        },
    ];

    return (
        <div className="manage_feedback_main_container_admin_123">
            <Title level={2}>Manage Feedbacks</Title>
            
            <div className="export_buttons_container_123" style={{ marginBottom: '20px' }}>
                <Space size="middle">
                    <Button 
                        type="primary" 
                        icon={<AiOutlineFileExcel />}
                        className="export_button_admin_123"
                    >
                        <CSVLink
                            data={allFeedbacks.map(feedback => ({
                                FeedbackID: generateFeedbackId(feedback),
                                Title: feedback.title,
                                Username: feedback.username,
                                UserID: feedback.username === 'Anonymous' ? 'Hidden' : feedback.userID,
                                Rating: feedback.rating,
                                Description: feedback.description,
                                Timestamp: new Date(feedback.createdAt).toLocaleString(),
                            }))}
                            filename={"feedbacks.csv"}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                            Export CSV
                        </CSVLink>
                    </Button>
                    
                    <Button 
                        type="primary" 
                        onClick={generatePDFReport} 
                        icon={<AiOutlineFilePdf />}
                        className="pdf_button_admin_123"
                        style={{ backgroundColor: '#e74c3c', borderColor: '#e74c3c' }}
                    >
                        Download PDF Report
                    </Button>
                </Space>
            </div>
            
            <Table
                columns={columns}
                dataSource={feedbacks}
                loading={loading}
                pagination={{
                    current: page,
                    total: total,
                    pageSize: limit,
                    onChange: (page) => setPage(page),
                }}
                rowKey="_id"
                bordered
                className="feedback_table_admin_123"
            />
        </div>
    );
}

export default ManageFeedbacks;