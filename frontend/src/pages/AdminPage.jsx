import React, { useEffect, useState } from "react";
import SideMenu from "../components/admin/SideMenu";
import NavBar from "../components/admin/NavBar";
import AdminRoutes from "../components/AdminRoutes";
import { useNavigate } from "react-router-dom";
import Loader  from "../components/Loader";

function AdminPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true); // Default to true to avoid flickering

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("currentUser"));
        if (!user) {
            navigate("/login"); // Redirect if not logged in
        } else if (user.userType !== "Admin") {
            navigate("/admin"); // Redirect if not an admin
        } else {
            setLoading(false);
        }
    }, [navigate]);

    return (
        <>
            {loading ? (
                <div className="center" style={{ height: "100vh" }}>
                    <Loader />
                </div>
            ) : (
                <div className="Admin_DashboardContainer">
                    <div className="Admin_SideMenuAndPageContent">
                        <div className="admin_sidebar_container">
                            <SideMenu />
                        </div>
                        <div className="Admin_PageContent">
                            <NavBar />
                            <AdminRoutes />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default AdminPage;