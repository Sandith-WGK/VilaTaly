import React, { useState, useEffect } from "react";
import { Line, Pie } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Progress } from "antd"; // Ant Design Progress for the rating breakdown
import axios from "axios";
import { Link } from "react-router-dom";

// Register necessary chart components
ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend, ArcElement);

function Dashboard() {
    //const [bookings, setBookings] = useState([]);
    //const [eventCount, setEventCount] = useState(0); // State for storing total event count
    const [feedbackCount, setFeedbackCount] = useState(0);
    const [feedbackRatings, setFeedbackRatings] = useState([]);
    const [ratingSummary, setRatingSummary] = useState({
        total: 0,
        ratings: [],
        average: 0
    });
    const [feedbackData, setFeedbackData] = useState({
        totalLikes: 0,
        totalDislikes: 0,
        totalFeedbacks: 0,
        feedbacksByCategory: {}
    });

    // Define fetchFeedbackRatings outside useEffect
    const fetchFeedbackRatings = async () => {
        try {
            // Use the same API endpoint as ManageFeedbacks
            const response = await axios.post("/api/feedback/getFeedback", { page: 1, limit: 0 });
            console.log("Raw feedbacks:", response.data.feedbacks);

            // Process feedbacks to get monthly counts
            const monthlyCounts = response.data.feedbacks.reduce((acc, feedback) => {
                const month = new Date(feedback.createdAt).getMonth() + 1; // getMonth() returns 0-11
                acc[month] = (acc[month] || 0) + 1;
                return acc;
            }, {});

            // Convert to array format expected by the chart
            const formattedData = Object.entries(monthlyCounts).map(([month, count]) => ({
                _id: parseInt(month),
                count: count
            }));

            console.log("Processed monthly counts:", formattedData);
            setFeedbackRatings(formattedData);
        } catch (error) {
            console.error("Error fetching feedback ratings:", error);
            setFeedbackRatings([]);
        }
    };

    // Fetch feedback count, ratings, and rating summary from the backend API
    useEffect(() => {
        const fetchFeedbackCount = async () => {
            try {
                const response = await axios.get("/api/feedback/feedbackCount");
                setFeedbackCount(response.data.count);
            } catch (error) {
                console.error("Error fetching feedback count", error);
            }
        };

        const fetchRatingsSummary = async () => {
            try {
                const response = await axios.get("/api/feedback/ratingsSummary");
                setRatingSummary(response.data);
            } catch (error) {
                console.error("Error fetching ratings summary", error);
            }
        };

        const fetchFeedbackData = async () => {
            try {
                const response = await axios.post("/api/feedback/getFeedback", { page: 1, limit: 100 });
                const feedbacks = response.data.feedbacks;

                // Calculate likes and dislikes
                const totalLikes = feedbacks.reduce((acc, feedback) => acc + (feedback.likes || 0), 0);
                const totalDislikes = feedbacks.reduce((acc, feedback) => acc + (feedback.dislikes || 0), 0);

                // Calculate feedbacks by category
                const feedbacksByCategory = feedbacks.reduce((acc, feedback) => {
                    const category = feedback.title || 'Uncategorized';
                    acc[category] = (acc[category] || 0) + 1;
                    return acc;
                }, {});

                setFeedbackData({
                    totalLikes,
                    totalDislikes,
                    totalFeedbacks: feedbacks.length,
                    feedbacksByCategory
                });
            } catch (error) {
                console.error("Error fetching feedback data", error);
            }
        };

        fetchFeedbackCount();
        fetchFeedbackRatings();
        fetchRatingsSummary();
        fetchFeedbackData();
    }, []);

    // Add useEffect to refresh data periodically
    useEffect(() => {
        const interval = setInterval(() => {
            fetchFeedbackRatings();
        }, 300000); // Refresh every 5 minutes

        return () => clearInterval(interval);
    }, []);

    // Fetch event count from the backend API
   /* const fetchEventCount = async () => {
        try {
            const response = await axios.get("/api/event/getTotalEvents");
            console.log("API Response:", response.data); // Log the API response to inspect the data

            // Use totalEvents from the response
            if (response.data.totalEvents) {
                setEventCount(response.data.totalEvents); // Set the total event count
            } else {
                console.error("totalEvents not found in response.");
            }
        } catch (error) {
            console.error("Error fetching event count:", error);
        }
    };

    // Call the function in useEffect
    useEffect(() => {
        fetchEventCount();
    }, []);*/

    // Pie chart data for likes and dislikes
    const pieChartData = {
        labels: ["Likes", "Dislikes"],
        datasets: [
            {
                data: [feedbackData.totalLikes, feedbackData.totalDislikes],
                backgroundColor: ["#36A2EB", "#FF6384"],
                hoverBackgroundColor: ["#36A2EB", "#FF6384"],
            },
        ],
    };

    const pieChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: true,
                position: "top",
            },
        },
    };

    // Prepare data for the line chart (feedback trends over months)
    const feedbackMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Create an array of all months with default count of 0
    const allMonthsData = feedbackMonths.map((month, index) => ({
        _id: index + 1,
        count: 0
    }));

    // Merge the API data with default data
    const mergedData = allMonthsData.map(month => {
        const apiData = feedbackRatings.find(rating => rating._id === month._id);
        console.log(`Month ${month._id}:`, apiData); // Debug log for each month
        return {
            ...month,
            count: apiData ? apiData.count : 0
        };
    });

    console.log("Final merged data:", mergedData); // Debug log

    const chartData = {
        labels: mergedData.map(data => feedbackMonths[data._id - 1]),
        datasets: [
            {
                label: 'Feedback Count',
                data: mergedData.map(data => data.count),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 8,
                borderWidth: 3,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Number of Feedbacks',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                },
                ticks: {
                    stepSize: 1,
                    precision: 0
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Month',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                }
            },
        },
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `Feedbacks: ${context.raw}`;
                    }
                }
            }
        },
    };

   /* // Fetch event bookings from the backend
    useEffect(() => {
        const fetchRecentBookings = async () => {
            try {
                const response = await axios.get('/api/event/getRecentBookings'); // Fetch recent 5 bookings
                console.log('API Response:', response.data); // Log the API response to inspect the data
                setBookings(response.data.bookings); // Update the bookings state with the recent 5 bookings
            } catch (error) {
                console.error('Error fetching recent bookings:', error);
            }
        };

        fetchRecentBookings();
    }, []);*/




    // Calculate the percentage of each rating
    const totalRatings = ratingSummary.total;
    const getPercentage = (count) => (count / totalRatings) * 100;

    return (
        <div className="admin_dashboard_main_area">
            <div className="admin_dashboard_card_main_section">
                <div className="admin_dashboard_card card4">
                    <h1 style={{ fontSize: "30px" }}>Total Feedbacks</h1>
                    <h2>{feedbackCount}</h2>
                </div>
            </div>
            <div className="admin_dashboard_chart_section">
                <div className="admin_feedback_cart_section">
                    <div className="admin_dashboard_chart">
                        <h1 style={{ fontSize: "30px" }}>Feedback Trends</h1>
                        <Line data={chartData} options={chartOptions} />
                        
                        {/* Rating Breakdown Section */}
                        <div className="admin_panel_progress_rating_section">
                            <div className="rating_breakdown_container" style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "15px",
                                height: "200px",
                                backgroundColor: "#ffffff",
                                borderRadius: "8px",
                                marginTop: "2.6%",
                                marginLeft: "-3%",
                                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)"
                            }}>
                                {/* Left Side - Average Rating */}
                                <div className="average_rating" style={{
                                    textAlign: "center",
                                    padding: "10px",
                                    borderRight: "0.2px solid #ddd"
                                }}>
                                    <h1 style={{ fontSize: "40px" }}>{ratingSummary.average.toFixed(1)}</h1>
                                    <div style={{ fontSize: "24px", color: "#FFD700" }}>
                                        {Array(Math.round(ratingSummary.average))
                                            .fill()
                                            .map((_, i) => (
                                                <span key={i}>⭐</span>
                                            ))}
                                        {ratingSummary.average % 1 !== 0 && <span>⭐</span>}
                                    </div>
                                    <p style={{ color: "green" }}>Average Rating</p>
                                </div>
                                {/* Right Side - Rating Breakdown */}
                                <div className="rating_breakdown" style={{ flex: 1, paddingLeft: "20px", marginLeft: "-10px" }}>
                                    {[5, 4, 3, 2, 1, 0].map((star) => (
                                        <div
                                            key={star}
                                            style={{ display: "flex", alignItems: "center", marginBottom: "8px", marginLeft: "10px" }}
                                        >
                                            <span style={{ width: "50px", fontSize: "18px", color: "#FFD700" }}>
                                                {star === 0 ? (
                                                    <span style={{ color: "#999" }}>No Rating</span>
                                                ) : (
                                                    Array(star)
                                                        .fill()
                                                        .map((_, i) => (
                                                            <span key={i}>⭐</span>
                                                        ))
                                                )}
                                            </span>
                                            <Progress
                                                percent={getPercentage(ratingSummary.ratings.find(rating => rating._id === star)?.count || 0)}
                                                showInfo={false}
                                                strokeColor={
                                                    star === 5 ? "#52c41a" : 
                                                    star === 4 ? "#87d068" : 
                                                    star === 3 ? "#faad14" : 
                                                    star === 2 ? "#fa8c16" : 
                                                    star === 1 ? "#f5222d" : 
                                                    "#999999"
                                                }
                                                style={{ width: "200px", marginLeft: "73px" }}
                                            />
                                            <span style={{ marginLeft: "10px" }}>
                                                {ratingSummary.ratings.find(rating => rating._id === star)?.count || 0}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Pie Chart for likes and dislikes */}
                    <div style={{
                        padding: "20px",
                        borderRadius: "8px",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                        marginBottom: "20px",
                        textAlign: "center",
                        width: "950px",
                        height: "600px",
                        maxWidth: "500px",
                        margin: "2% 1% 0%",
                    }}>
                        <h1 style={{
                            fontSize: "30px",
                            marginBottom: "20px",
                            color: "#333",
                            textAlign: "right",
                        }}>
                            Feedback Engagement
                        </h1>
                        <Pie data={pieChartData} options={pieChartOptions} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
