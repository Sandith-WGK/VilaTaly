import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Modal,
  Form,
  Input,
  Button,
  DatePicker,
  message,
  Tag,
  Image,
  Divider,
  Card,
  Alert,
} from "antd";
import moment from "moment";
import packageImgs from "../assets/Images/packageImg.jpg";
import "./PackageViewPage.css";

const { RangePicker } = DatePicker;

function PackageViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [pkg, setPkg] = useState(null);
  const [basePrice, setBasePrice] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullyBookedDates, setFullyBookedDates] = useState([]);
  const [isPaymentFormVisible, setIsPaymentFormVisible] = useState(false);
  const [isBookingConfirmed, setIsBookingConfirmed] = useState(false);
  const [form] = Form.useForm();

  const { checkInDate: initialCheckIn, checkOutDate: initialCheckOut } =
    location.state || {};

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const response = await axios.get(`/api/package/getPackage/${id}`);
        const packageData = response.data.package;
        setPkg(packageData);

        const base = packageData.basePrice;
        const discounted = packageData.discountedPrice || base;
        const discount = packageData.discountApplied ? base - discounted : 0;

        setBasePrice(base);
        setDiscountAmount(discount);
        setTotalPrice(discounted);

        const datesResponse = await axios.get(
          `/api/booking/availableDates/${id}`
        );
        setFullyBookedDates(datesResponse.data.fullyBookedDates);

        if (initialCheckIn && initialCheckOut) {
          const checkInMoment = moment(initialCheckIn);
          const checkOutMoment = moment(initialCheckOut);
          if (checkInMoment.isValid() && checkOutMoment.isValid()) {
            form.setFieldsValue({
              dates: [checkInMoment, checkOutMoment],
            });
            const nights = checkOutMoment.diff(checkInMoment, "days");
            setTotalPrice(discounted * (nights > 0 ? nights : 1));
          }
        }
      } catch (error) {
        console.error("Error fetching package:", error);
        message.error("Failed to load package details.");
      }
    };
    fetchPackage();
  }, [id, form, initialCheckIn, initialCheckOut]);

  const disabledDate = (current) => {
    // Prevent selection of dates before today
    if (current && current < moment().startOf('day')) {
      return true;
    }
    
    // Also prevent selection of fully booked dates
    const dateStr = current.format("YYYY-MM-DD");
    return fullyBookedDates.includes(dateStr);
  };

  const onDateChange = (dates) => {
    if (dates && dates.length === 2) {
      const [checkInDate, checkOutDate] = dates;
      const nights = checkOutDate.diff(checkInDate, "days");
      const discountedPrice = basePrice - discountAmount;
      const newTotalPrice = discountedPrice * (nights > 0 ? nights : 1);
      setTotalPrice(newTotalPrice);
    } else {
      setTotalPrice(basePrice - discountAmount);
    }
  };

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  useEffect(() => {
    if (!currentUser) {
      message.error("You must be logged in to make a reservation.");
      navigate("/login");
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const checkInDate = values.dates[0].format("YYYY-MM-DD");
      const checkOutDate = values.dates[1].format("YYYY-MM-DD");

      const reservationData = {
        packageId: id,
        userId: currentUser._id,
        checkInDate,
        checkOutDate,
        guestName: values.name,
        guestEmail: values.email,
        guestPhone: values.phone,
        totalAmount: totalPrice,
      };

      setIsPaymentFormVisible(true);
    } catch (error) {
      console.error("Failed to validate booking details:", error);
      message.error("Please fill in all required fields.");
    }
  };

  const handlePayment = async (values) => {
    try {
      const paymentResponse = await axios.post("/api/booking/process", {
        cardNumber: values.cardNumber,
        expiryDate: values.expiryDate,
        cvv: values.cvv,
        amount: totalPrice,
      });

      if (paymentResponse.data.success) {
        const bookingResponse = await axios.post(
          "/api/booking/reservePackage",
          {
            packageId: id,
            userId: currentUser._id,
            checkInDate: form.getFieldValue("dates")[0].format("YYYY-MM-DD"),
            checkOutDate: form.getFieldValue("dates")[1].format("YYYY-MM-DD"),
            guestName: form.getFieldValue("name"),
            guestEmail: form.getFieldValue("email"),
            guestPhone: form.getFieldValue("phone"),
            totalAmount: totalPrice,
          }
        );

        setIsBookingConfirmed(true);
        message.success("Booking submitted for confirmation!");
      } else {
        message.error("Payment failed. Please try again.");
      }
    } catch (error) {
      console.error("Payment processing failed:", error);
      message.error("Payment failed. Please try again.");
    }
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setIsPaymentFormVisible(false);
    setIsBookingConfirmed(false);
  };

  const fullRefundDate = moment().add(2, "days").format("MMM Do YYYY");
  const partialRefundDate = moment().add(3, "days").format("MMM Do YYYY");

  // Function to determine package status
  const getPackageStatus = (pkg) => {
    const now = moment();
    const startDate = moment(pkg.startDate);
    const endDate = moment(pkg.endDate);

    if (now.isBefore(startDate)) {
      return { status: "Upcoming", color: "blue" };
    } else if (now.isAfter(endDate)) {
      return { status: "Expired", color: "red" };
    } else {
      return { status: "Active", color: "green" };
    }
  };

  if (!pkg) return <p>Loading...</p>;

  const { status, color } = getPackageStatus(pkg);

  return (
    <div className="package-view-page">
      <div className="package-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h1>{pkg.name}</h1>
          <Tag color={color}>{status}</Tag>
        </div>
        <Tag color="green">{pkg.capacity} Guests</Tag>
      </div>

      <div className="package-content">
        <div className="package-image">
          <Image
            style={{ height: "80vh" }}
            className="pc"
            src={pkg.image || packageImgs}
            alt={pkg.name}
          />
        </div>

        <div className="package-details">
          <h2>Package Details</h2>
          <Divider />
          <ul>
            <li>
              <strong>Room Type:</strong> {pkg.roomType?.name || "N/A"}
            </li>
            <li>
              <strong>Features:</strong>{" "}
              {pkg.features.length > 0
                ? pkg.features.join(", ")
                : "No features listed"}
            </li>
            <li>
              <strong>Valid Period:</strong>{" "}
              {moment(pkg.startDate).format("MMM D, YYYY")} - {moment(pkg.endDate).format("MMM D, YYYY")}
            </li>
          </ul>

          <h2>Cancellation Policy</h2>
          <Divider />
          <p>
            Free cancellation until <strong>{fullRefundDate}</strong>.<br />
            After <strong>{partialRefundDate}</strong>: <span>50% refund.</span>
          </p>

          <h2>Pricing</h2>
          <Divider />
          <div className="price-breakdown">
            <div className="price-item">
              <span>Base Price (per night):</span>
              <span>${basePrice.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="price-item">
                <span>Discount Amount (per night):</span>
                <span style={{ color: "green" }}>
                  -${discountAmount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="price-item total">
              <span>Total Price:</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <Button
            type="primary"
            size="large"
            onClick={showModal}
            style={{ width: "100%", marginTop: "20px" }}
          >
            Book Now
          </Button>
        </div>
      </div>

      <Modal
        title={`Reserve ${pkg.name}`}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
      >
        {!isPaymentFormVisible && !isBookingConfirmed ? (
          <Form form={form} layout="vertical">
            <Form.Item
              label="Name"
              name="name"
              initialValue={currentUser.name || ""}
              rules={[{ required: true, message: "Please enter your name" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Email"
              name="email"
              initialValue={currentUser.email || ""}
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Phone"
              name="phone"
              rules={[
                { required: true, message: "Please enter your phone number" },
                {
                  pattern: /^(\+\d{1,3}[- ]?)?\d{10}$/,
                  message: "Please enter a valid 10-digit phone number",
                },
              ]}
            >
              <Input placeholder="1234567890" />
            </Form.Item>
            <Form.Item
              label="Check-in & Check-out Dates"
              name="dates"
              rules={[
                {
                  required: true,
                  message: "Please select check-in and check-out dates",
                },
              ]}
            >
              <RangePicker
                format="YYYY-MM-DD"
                disabledDate={disabledDate}
                onChange={onDateChange}
              />
            </Form.Item>
            <Form.Item label="Total Cost">
              <Input
                value={`$${totalPrice.toFixed(2)}`}
                readOnly
                style={{ fontWeight: "bold" }}
              />
            </Form.Item>
            <Button type="primary" onClick={handleOk}>
              Proceed to Payment
            </Button>
          </Form>
        ) : isPaymentFormVisible && !isBookingConfirmed ? (
          <Form onFinish={handlePayment} layout="vertical">
            <Card title="Payment Details" style={{ width: "100%" }}>
              <Form.Item
                label="Card Number"
                name="cardNumber"
                rules={[
                  { required: true, message: "Please enter your card number" },
                  {
                    pattern: /^[0-9]{16}$/,
                    message: "Please enter a valid 16-digit card number",
                  },
                ]}
              >
                <Input placeholder="1234 5678 9012 3456" />
              </Form.Item>
              <Form.Item
                label="Expiry Date"
                name="expiryDate"
                rules={[
                  { required: true, message: "Please enter the expiry date" },
                  {
                    pattern: /^(0[1-9]|1[0-2])\/?([0-9]{2})$/,
                    message: "Please enter a valid expiry date (MM/YY)",
                  },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      
                      // Parse the expiry date
                      const match = value.match(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/);
                      if (!match) return Promise.resolve();
                      
                      const month = parseInt(match[1], 10);
                      const year = parseInt('20' + match[2], 10);
                      
                      // Get current date
                      const currentDate = new Date();
                      const currentMonth = currentDate.getMonth() + 1; // JS months are 0-based
                      const currentYear = currentDate.getFullYear();
                      
                      // Check if the card is expired
                      if (year < currentYear || (year === currentYear && month < currentMonth)) {
                        return Promise.reject("Card has expired. Please use a valid card.");
                      }
                      
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input placeholder="MM/YY" />
              </Form.Item>
              <Form.Item
                label="CVV"
                name="cvv"
                rules={[
                  { required: true, message: "Please enter the CVV" },
                  {
                    pattern: /^[0-9]{3}$/,
                    message: "Please enter a valid 3-digit CVV",
                  },
                ]}
              >
                <Input placeholder="123" />
              </Form.Item>
              <Button type="primary" htmlType="submit">
                Confirm Payment
              </Button>
            </Card>
          </Form>
        ) : (
          <div>
            <h3>Booking Submitted!</h3>
            <Alert
              width={100}
              message="Your booking is pending confirmation"
              description={
                <>
                  <p>
                    Your booking request is pending approval. Our team will
                    manually review and confirm your booking within 24 hours.
                  </p>
                  <p>
                    You can check your booking status anytime in the{" "}
                    <a href="/profile">Bookings section of your profile</a>.
                  </p>
                  <p>
                    Note: You may modify or cancel this booking until it's
                    confirmed by our team.
                  </p>
                </>
              }
              type="info"
              showIcon
            />
            <div style={{ marginTop: "20px" }}>
              <p>Package: {pkg.name}</p>
              <p>
                Check-in: {form.getFieldValue("dates")[0].format("MMM Do YYYY")}
              </p>
              <p>
                Check-out:{" "}
                {form.getFieldValue("dates")[1].format("MMM Do YYYY")}
              </p>
              <p>Total Amount: ${totalPrice.toFixed(2)}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default PackageViewPage;