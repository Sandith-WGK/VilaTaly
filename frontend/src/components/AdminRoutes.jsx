import { Route, Routes } from "react-router-dom";
import Attendance from "./admin/Attendance";
import DailyUsage from "./admin/DailyUsage";
import Dashboard from "./admin/Dashboard";
import ManageDiscounts from "./admin/ManageDiscounts";
import ManageEmployees from "./admin/ManageEmployees";
import ManageEvents from "./admin/ManageEvents";
import ManageFeedbacks from "./admin/ManageFeedbacks";
import ManageFoods from "./admin/ManageFoods";
import ManageInventory from "./admin/ManageInventory";
import ManageOrders from "./admin/ManageOrders";
import ManagePackages from "./admin/ManagePackages";
import ManageParkings from "./admin/ManageParkings";
import ManageRooms from "./admin/ManageRooms";

function AdminRoutes() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="manage-events" element={<ManageEvents />} />
        <Route path="manage-packages" element={<ManagePackages />} />
        <Route path="manage-discounts" element={<ManageDiscounts />} />
        <Route path="manage-foods" element={<ManageFoods />} />
        <Route path="manage-orders" element={<ManageOrders />} />
        <Route path="manage-packages" element={<ManagePackages />} />
        <Route path="manage-parkings" element={<ManageParkings />} />
        <Route path="manage-rooms" element={<ManageRooms />} />
        <Route path="manage-employees" element={<ManageEmployees />} />
        <Route path="manage-feedbacks" element={<ManageFeedbacks />} />
        <Route path="manage-inventory" element={<ManageInventory />} />
        <Route path="daily-usage" element={<DailyUsage />} />
        <Route path="attendance" element={<Attendance />} />
      </Routes>
    </div>
  );
}

export default AdminRoutes;
