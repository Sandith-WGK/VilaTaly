import { Icon } from "@iconify/react";
import { ConfigProvider, Menu } from "antd";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../../assets/Logo/logo.png";

// Helper function to create a menu item object
function getItem(label, key, icon, children, type) {
  return {
    key, // Unique key for the menu item
    icon, // Icon component for the menu item
    children, // Array of submenu items, if any
    label, // Text label for the menu item
    type, // Optional type for the menu item (e.g., group)
  };
}

// Array of menu items for the sidebar
const items = [
  getItem(
    "Dashboard",
    "/admin",
    <Icon icon="material-symbols:dashboard-outline" />
  ),
  getItem(
    "Bookings",
    "/admin/manage-events",
    <Icon icon="ic:outline-inventory" />
  ),
  getItem(
    "Packages",
    "/admin/manage-packages",
    <Icon icon="mdi:bed-outline" />
  ),
  getItem("Discounts",
    "/admin/manage-discounts", 
    <Icon icon="mdi:tag-outline" />),
  getItem(
    "Employees",
    "/admin/manage-employees",
    <Icon icon="mdi:account-group-outline" />
  ),
  getItem(
    "Attendance",
    "/admin/attendance",
    <Icon icon="mdi:account-group-outline" />
  ),
  getItem(
    "Inventory",
    "/admin/manage-inventory",
    <Icon icon="mdi:warehouse" />
  ), // Added Manage Inventory
  getItem(
    "Daily Usage",
    "/admin/daily-usage",
    <Icon icon="mdi:warehouse" />
  ),
  getItem(
    "Feedbacks",
    "/admin/manage-feedbacks",
    <Icon icon="mdi:feedback-outline" />
  ),
];

// Keys of submenu items that have children, used to manage open states
const rootSubmenuKeys = [
  "sub1",
  "sub2",
  "sub3",
  "sub4",
  "sub5",
  "sub6",
  "sub7",
  "sub8",
];

function SideMenu() {
  const location = useLocation(); // Hook to get current location (URL path)
  const navigate = useNavigate(); // Hook to programmatically navigate to different routes
  const [openKeys, setOpenKeys] = useState(["/admin"]); // State to manage which submenus are open
  const [selectedKeys, setSelectedKeys] = useState("/admin"); // State to track the currently selected menu item

  // Effect to update selected menu item based on the current URL path
  useEffect(() => {
    const pathName = location.pathname;
    setSelectedKeys(pathName);
  }, [location.pathname]);

  // Handler for when the user opens or closes a submenu
  const onOpenChange = (keys) => {
    const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
    // If the latest opened key is not a root submenu, update open keys
    if (latestOpenKey && rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
      setOpenKeys(keys);
    } else {
      setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
    }
  };

  return (
    <div className="Admin_SideMenu">
      <img src={Logo} alt="logo" className="admin_sidebar_logo" />{" "}
      {/* Sidebar logo */}
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#27ae61", // Set your desired primary color
          },
          components: {
            Menu: {
              iconSize: "20px", // Set the size of the icons in the menu
              itemHeight: "40px", // Set the height of each menu item
              subMenuItemBg: "#ffffff", // Set background color of sub-menu items
            },
          },
        }}
      >
        <Menu
          mode="inline" // Menu layout mode (inline means vertical sidebar)
          openKeys={openKeys} // Keys of currently open submenus
          selectedKeys={[selectedKeys]} // Currently selected menu item key
          onOpenChange={onOpenChange} // Handler for opening/closing submenus
          onClick={(item) => {
            navigate(item.key); // Navigate to the route corresponding to the clicked menu item
          }}
          style={{
            width: 256, // Set the width of the sidebar
            textAlign: "left", // Align menu text to the left
          }}
          items={items} // Array of menu items to render
        />
      </ConfigProvider>
    </div>
  );
}

export default SideMenu;
