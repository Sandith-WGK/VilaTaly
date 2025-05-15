Absolutely! Here’s an improved `README.md` that includes details about the **Inventory Management**, **Employee Management**, **Event/Booking Management**, and **Feedback Management** features, as well as references to the relevant pages/components in your codebase.

---

# VilaTaly Hotel Management System

## Overview

VilaTaly is a modern hotel management system designed to streamline room package management, booking, inventory, employee, and feedback management for both administrators and guests. The system enables hotel staff to efficiently manage accommodation packages, discounts, inventory, employees, and events, while providing guests with a seamless experience to explore, compare, and book rooms that fit their preferences and budget.

---

## Features

### For Admins

- **Room Package Management**
  - Add, update, and remove room packages with details like room type, price, features, guest limits, and availability.
  - Upload images for each package.
  - Instantly update package information for guests.
  - **Related Page:** `frontend/src/components/admin/ManagePackages.jsx`

- **Discount & Offer Management**
  - Create, update, and remove discounts (percentage or fixed amount).
  - Apply discounts to specific packages or all packages.
  - Set validity periods for seasonal or promotional offers.
  - **Related Page:** `frontend/src/components/admin/ManageDiscounts.jsx`

- **Inventory Management**
  - Add, update, and remove inventory items (e.g., food, beverages, supplies).
  - Track stock levels, expiration dates, and reorder points.
  - Export inventory data as CSV or PDF.
  - Visualize inventory analytics with charts.
  - **Related Page:** `frontend/src/components/admin/ManageInventory.jsx`

- **Employee Management**
  - Add, update, and remove employee records.
  - Assign departments, track star points, and manage achievements.
  - Upload employee images and generate QR codes for attendance.
  - Export employee and attendance data as CSV or PDF.
  - **Related Page:** `frontend/src/components/admin/ManageEmployees.jsx`

- **Event/Booking Management**
  - View, update, and delete all guest bookings.
  - Change booking status (pending, confirmed, cancelled).
  - Export booking data as CSV.
  - View total confirmed booking revenue.
  - **Related Page:** `frontend/src/components/admin/ManageEvents.jsx`

- **Feedback Management**
  - View all guest feedback with ratings and comments.
  - Export feedback as CSV or PDF reports.
  - Analyze feedback statistics and rating distributions.
  - **Related Page:** `frontend/src/components/admin/ManageFeedbacks.jsx`

- **Reporting**
  - Generate and export PDF reports for packages, discounts, inventory, employees, bookings, and feedback.

---

### For Guests

- **Browse Packages**
  - View all available room packages with clear descriptions, images, prices, features, and guest limits.
  - Search, filter, and sort packages by various criteria.
  - **Related Page:** `frontend/src/pages/PackagePage.jsx`

- **View Offers**
  - See all current and upcoming discounts and special offers.
  - View which packages are eligible for each offer.
  - **Related Page:** `frontend/src/pages/Offers.jsx`

- **Book Rooms**
  - Book packages directly from the system.
  - See real-time updates to package availability and pricing.
  - **Related Page:** `frontend/src/pages/PackageView.jsx`

- **Feedback**
  - Submit feedback and ratings for their stay and services.

---

## Tech Stack

- **Frontend:** React, Ant Design, Axios, Moment.js, Recharts
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **PDF Generation:** jsPDF
- **Other:** React Router, Webpack

---

## Getting Started

### Prerequisites

- Node.js (v14+ recommended)
- npm or yarn
- MongoDB

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/VilaTaly.git
   cd VilaTaly
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables:**
   - Create a `.env` file in the `backend` directory with your MongoDB URI and any other secrets.

5. **Start the backend server:**
   ```bash
   npm start
   ```

6. **Start the frontend development server:**
   ```bash
   cd ../frontend
   npm start
   ```

7. **Access the app:**
   - Open your browser and go to `http://localhost:3000`

---

## Folder Structure

```
VilaTaly/
  ├── backend/
  │   ├── models/
  │   ├── routes/
  │   ├── controllers/
  │   └── ...
  ├── frontend/
  │   ├── src/
  │   │   ├── components/
  │   │   │   ├── admin/
  │   │   │   │   ├── ManagePackages.jsx
  │   │   │   │   ├── ManageDiscounts.jsx
  │   │   │   │   ├── ManageInventory.jsx
  │   │   │   │   ├── ManageEmployees.jsx
  │   │   │   │   ├── ManageEvents.jsx
  │   │   │   │   └── ManageFeedbacks.jsx
  │   │   ├── pages/
  │   │   │   ├── PackagePage.jsx
  │   │   │   ├── PackageView.jsx
  │   │   │   ├── Offers.jsx
  │   │   │   └── ...
  │   │   └── ...
  │   └── ...
  └── README.md
```

---

## Usage

- **Admin:** Log in to access the admin dashboard for managing packages, discounts, inventory, employees, events, and feedback.
- **Guest:** Browse packages and offers, book rooms, and submit feedback directly from the website.

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

---

## License

This project is licensed under the MIT License.

---

## Contact

For questions or support, please contact it23305182@my.sliit.lk.

---


