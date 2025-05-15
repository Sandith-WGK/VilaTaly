import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, Button, Typography, message, Modal, List, Image } from "antd";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import "../css/users/offers.css";

const { Title, Text } = Typography;

const Offers = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const response = await axios.get("/api/discount/getDiscounts");
        console.log("API Response:", response.data);
        const fetchedDiscounts = Array.isArray(response.data.discounts)
          ? response.data.discounts
          : [];
        // Sort discounts by startDate in ascending order
        fetchedDiscounts.sort((a, b) =>
          moment(a.startDate).isBefore(moment(b.startDate)) ? -1 : 1
        );
        setDiscounts(fetchedDiscounts);
      } catch (error) {
        console.error("Error fetching discounts:", error);
        message.error("Failed to load offers");
        setDiscounts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDiscounts();
  }, []);

  const getDiscountStatus = (startDate, endDate) => {
    const now = moment();
    const start = moment(startDate);
    const end = moment(endDate);

    if (now.isBefore(start)) {
      return "Coming Soon";
    } else if (now.isBetween(start, end, undefined, "[]")) {
      return "Active";
    } else {
      return "Expired";
    }
  };

  const handleViewPackages = async (discount) => {
    try {
      if (discount.applicablePackages.length === 0) {
        // For "All Packages" discount, fetch packages with date range filtering
        const response = await axios.get("/api/package/getPackages", {
          params: {
            discountStartDate: discount.startDate,
            discountEndDate: discount.endDate,
          },
        });
        const allPackages = Array.isArray(response.data.packages)
          ? response.data.packages
          : [];
        setSelectedPackages(allPackages.map(pkg => ({
          ...pkg,
          discountStatus: getDiscountStatus(discount.startDate, discount.endDate),
          discountInfo: discount
        })));
      } else {
        // For specific packages, filter them by date range client-side
        const discountStart = moment(discount.startDate);
        const discountEnd = moment(discount.endDate);
        const filteredPackages = discount.applicablePackages.filter((pkg) => {
          const pkgStart = moment(pkg.startDate);
          const pkgEnd = moment(pkg.endDate);
          // Check if package date range overlaps with discount date range
          return (
            pkgStart.isSameOrBefore(discountEnd) &&
            pkgEnd.isSameOrAfter(discountStart)
          );
        });
        setSelectedPackages(filteredPackages.map(pkg => ({
          ...pkg,
          discountStatus: getDiscountStatus(discount.startDate, discount.endDate),
          discountInfo: discount
        })));
      }
      setIsModalVisible(true);
    } catch (error) {
      console.error("Error fetching packages:", error);
      message.error("Failed to load applicable packages");
      setSelectedPackages([]);
      setIsModalVisible(true);
    }
  };

  const handleViewSinglePackage = (packageId) => {
    navigate(`/packages/${packageId}`);
    setIsModalVisible(false);
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <Text>Loading offers...</Text>
      </div>
    );
  }

  return (
    <div
      className="offers-page"
      style={{ padding: "40px", backgroundColor: "#f5f5f5" }}
    >
      <Title level={2} style={{ textAlign: "center", marginBottom: "40px" }}>
        Current and Upcoming Offers
      </Title>
      {discounts.length === 0 ? (
        <Text>No active offers available at this time.</Text>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
            alignItems: "stretch",
          }}
        >
          {discounts.map((discount) => {
            const status = getDiscountStatus(discount.startDate, discount.endDate);
            return (
              <Card
                key={discount._id}
                hoverable
                style={{
                  borderRadius: "8px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                  overflow: "hidden",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
                bodyStyle={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#fff",
                    backgroundColor:
                      status === "Coming Soon"
                        ? "#ff9800"
                        : status === "Active"
                        ? "#4caf50"
                        : "#f44336",
                  }}
                >
                  {status}
                </div>
                <div
                  style={{
                    padding: "16px",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <Title
                      level={4}
                      style={{
                        margin: 0,
                        fontSize: "18px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                      }}
                    >
                      {discount.name}
                    </Title>
                    <Text
                      style={{
                        display: "block",
                        margin: "8px 0",
                        fontSize: "14px",
                        color: "#666",
                        lineHeight: "1.5",
                      }}
                    >
                      {discount.description}
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        margin: "8px 0",
                        fontSize: "14px",
                      }}
                    >
                      <Text strong style={{ flex: "0 0 40%" }}>
                        Applicable Packages:
                      </Text>
                      <Text style={{ flex: "0 0 60%", textAlign: "left" }}>
                        {discount.applicablePackages.length === 0
                          ? "All Packages"
                          : discount.applicablePackages
                              .map((pkg) => pkg.name)
                              .join(", ")}
                      </Text>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        margin: "8px 0",
                        fontSize: "14px",
                      }}
                    >
                      <Text strong style={{ flex: "0 0 40%" }}>
                        Valid:
                      </Text>
                      <Text style={{ flex: "0 0 60%", textAlign: "left" }}>
                        {moment(discount.startDate).format("MMM D, YYYY")} -{" "}
                        {moment(discount.endDate).format("MMM D, YYYY")}
                      </Text>
                    </div>
                  </div>
                  <Button
                    type="primary"
                    block
                    style={{
                      marginTop: "16px",
                      backgroundColor: "#007bff",
                      borderColor: "#007bff",
                      borderRadius: "8px",
                      fontSize: "14px",
                      padding: "8px",
                    }}
                    onClick={() => handleViewPackages(discount)}
                  >
                    View Packages
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        title="Applicable Packages"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedPackages.length === 0 ? (
          <Text>No applicable packages found for this discount's date range.</Text>
        ) : (
          <List
            dataSource={selectedPackages}
            renderItem={(pkg) => (
              <List.Item
                actions={[
                  <Button
                    type="primary"
                    onClick={() => handleViewSinglePackage(pkg._id)}
                  >
                    View Details
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Image
                      src={pkg.image || "https://via.placeholder.com/150"}
                      style={{
                        width: "15vw",
                        height: "25vh",
                        objectFit: "cover",
                      }}
                    />
                  }
                  title={pkg.name}
                  description={
                    <>
                      <Text>Features: {pkg.features ? pkg.features.join(", ") : "No features listed"}</Text>
                      <br />
                      <Text>
                        Package valid: {pkg.startDate ? moment(pkg.startDate).format("MMM D, YYYY") : "N/A"} -{" "}
                        {pkg.endDate ? moment(pkg.endDate).format("MMM D, YYYY") : "N/A"}
                      </Text>
                      <br />
                      <Text>
                        {pkg.discountStatus === "Active" ? (
                          <>
                            <Text delete style={{ color: "#999" }}>Original Price: ${pkg.basePrice}</Text>
                            <br />
                            <Text strong style={{ color: "#52c41a" }}>
                              Discounted Price: $
                              {pkg.discountInfo.type === "percentage"
                                ? (pkg.basePrice * (1 - (pkg.discountInfo.value / 100))).toFixed(2)
                                : (pkg.basePrice - pkg.discountInfo.value).toFixed(2)}
                            </Text>
                          </>
                        ) : (
                          <Text strong>Price: ${pkg.basePrice}</Text>
                        )}
                      </Text>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </div>
  );
};

export default Offers;