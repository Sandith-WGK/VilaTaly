import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Typography, Select, Tag, DatePicker } from "antd";
import moment from "moment";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

function PackagePage() {
  const [packages, setPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]); // [checkInDate, checkOutDate]
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      try {
        const [checkInDate, checkOutDate] = dateRange;
        const params = {};
        if (checkInDate) params.checkInDate = checkInDate.format("YYYY-MM-DD");
        if (checkOutDate) params.checkOutDate = checkOutDate.format("YYYY-MM-DD");

        const response = await axios.get("/api/package/getPackages", { params });
        const fetchedPackages = Array.isArray(response.data.packages)
          ? response.data.packages
          : [];
        setPackages(fetchedPackages);
        setFilteredPackages(fetchedPackages);
      } catch (error) {
        console.error("Error fetching packages:", error);
        setPackages([]);
        setFilteredPackages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, [dateRange]);

  const getPackageStatus = (pkg) => {
    const now = moment();
    const startDate = moment(pkg.startDate);
    const endDate = moment(pkg.endDate);

    if (now.isBefore(startDate)) {
      return {
        status: "Upcoming",
        color: "#1890ff",
        backgroundColor: "#e6f7ff",
        borderColor: "#91d5ff",
      };
    } else if (now.isAfter(endDate)) {
      return {
        status: "Expired",
        color: "#ff4d4f",
        backgroundColor: "#fff1f0",
        borderColor: "#ffa39e",
      };
    } else {
      return {
        status: "Active",
        color: "#52c41a",
        backgroundColor: "#f6ffed",
        borderColor: "#b7eb8f",
      };
    }
  };

  useEffect(() => {
    let tempList = [...packages];

    if (statusFilter) {
      tempList = tempList.filter((pkg) => {
        const { status } = getPackageStatus(pkg);
        return status === statusFilter;
      });
    } else {
      tempList = tempList.filter((pkg) => {
        const { status } = getPackageStatus(pkg);
        return status !== "Expired";
      });
    }

    if (searchTerm) {
      tempList = tempList.filter(
        (pkg) =>
          (pkg.name &&
            pkg.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (pkg.roomType?.name &&
            pkg.roomType.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (pkg.features &&
            pkg.features.some((feature) =>
              feature.toLowerCase().includes(searchTerm.toLowerCase())
            ))
      );
    }

    if (sortOption) {
      if (sortOption === "low-to-high" || sortOption === "high-to-low") {
        tempList.sort((a, b) => {
          const priceA = a.discountApplied ? a.discountedPrice : a.basePrice;
          const priceB = b.discountApplied ? b.discountedPrice : b.basePrice;
          return sortOption === "low-to-high" ? priceA - priceB : priceB - priceA;
        });
      } else if (sortOption === "status") {
        tempList.sort((a, b) => {
          const statusA = getPackageStatus(a).status;
          const statusB = getPackageStatus(b).status;
          return statusA === "Active" ? -1 : statusB === "Active" ? 1 : 0;
        });
      }
    }

    setFilteredPackages(tempList);
  }, [searchTerm, packages, sortOption, statusFilter]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (value) => {
    setSortOption(value);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates || [null, null]);
  };

  const handleBookNow = (packageId) => {
    navigate(`/packages/${packageId}`);
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <Text>Loading packages...</Text>
      </div>
    );
  }

  return (
    <div
      className="package-list"
      style={{ padding: "40px", backgroundColor: "#f5f5f5" }}
    >
      <Title level={1} style={{ marginBottom: "20px" }}>
        Our Packages
      </Title>
      <hr style={{ marginBottom: "20px" }} />

      <div
        style={{
          marginBottom: "30px",
          display: "flex",
          gap: "10px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Search packages"
          value={searchTerm}
          onChange={handleSearchChange}
          style={{
            width: "300px",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            fontSize: "14px",
          }}
        />
        <RangePicker
          onChange={handleDateRangeChange}
          value={dateRange}
          format="YYYY-MM-DD"
          style={{ width: "300px" }}
          placeholder={["Check-in Date", "Check-out Date"]}
        />
        <Select
          placeholder="Sort by"
          style={{ width: "200px" }}
          onChange={handleSortChange}
          value={sortOption}
          allowClear
          onClear={() => setSortOption(null)}
        >
          <Option value="low-to-high">Price: Low to High</Option>
          <Option value="high-to-low">Price: High to Low</Option>
          <Option value="status">Status (Active first)</Option>
        </Select>
        <Select
          placeholder="Filter by status"
          style={{ width: "200px" }}
          onChange={handleStatusFilterChange}
          value={statusFilter}
          allowClear
          onClear={() => setStatusFilter(null)}
        >
          <Option value="Active">Active</Option>
          <Option value="Upcoming">Upcoming</Option>
        </Select>
      </div>

      <div style={{ margin: "20px 0" }}>
        <Title level={2} style={{ marginBottom: "20px" }}>
          Available Packages
        </Title>
        {filteredPackages.length === 0 ? (
          <Text>No packages available.</Text>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {filteredPackages.map((pkg) => {
              const { status, color, backgroundColor } = getPackageStatus(pkg);
              return (
                <div
                  className="package"
                  key={pkg._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    padding: "20px",
                    width: "100%",
                    minHeight: "150px",
                  }}
                >
                  <img
                    src={pkg.image || "https://via.placeholder.com/200x120"}
                    alt={pkg.name}
                    style={{
                      width: "200px",
                      height: "120px",
                      objectFit: "cover",
                      borderRadius: "4px",
                      marginRight: "20px",
                    }}
                  />
                  <div
                    className="package-details"
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Title level={3} style={{ margin: 0, fontSize: "24px" }}>
                        {pkg.name}
                      </Title>
                      <Tag
                        style={{
                          fontSize: "14px",
                          padding: "4px 12px",
                          borderRadius: "4px",
                          border: `1px solid ${color}`,
                          backgroundColor: backgroundColor,
                          color: color,
                          fontWeight: "500",
                          marginLeft: "12px",
                        }}
                      >
                        {status}
                      </Tag>
                    </div>
                    <Text style={{ fontSize: "14px", color: "#666" }}>
                      Room Type: {pkg.roomType?.name || "N/A"}
                    </Text>
                    <Text style={{ fontSize: "14px", color: "#666" }}>
                      Capacity: {pkg.capacity} guests
                    </Text>
                    <Text style={{ fontSize: "14px", color: "#666" }}>
                      Features: {pkg.features?.join(", ") || "None"}
                    </Text>
                    <Text style={{ fontSize: "14px", color: "#666" }}>
                      Valid: {moment(pkg.startDate).format("MMM D, YYYY")} -{" "}
                      {moment(pkg.endDate).format("MMM D, YYYY")}
                    </Text>
                  </div>
                  <div
                    className="package-price"
                    style={{
                      width: "150px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "8px",
                      paddingLeft: "20px",
                    }}
                  >
                    <Text style={{ fontSize: "12px", color: "#1b1b1b" }}>
                      From (per night)
                    </Text>
                    {pkg.discountApplied ? (
                      <>
                        <Text
                          style={{
                            fontSize: "16px",
                            textDecoration: "line-through",
                            color: "gray",
                          }}
                        >
                          ${pkg.basePrice}
                        </Text>
                        <Text
                          style={{
                            fontSize: "18px",
                            color: "#28a745",
                            fontWeight: "bold",
                          }}
                        >
                          ${pkg.discountedPrice.toFixed(2)}
                        </Text>
                      </>
                    ) : (
                      <Text style={{ fontSize: "18px", fontWeight: "bold" }}>
                        ${pkg.basePrice}
                      </Text>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookNow(pkg._id);
                      }}
                      style={{
                        backgroundColor: "#219652",
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "bold",
                        marginTop: "10px",
                      }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default PackagePage;