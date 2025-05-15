import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Navbar from "./components/CommonComponents/Navbar";
import AdminPage from "./pages/AdminPage";
import HomeScreen from "./pages/HomePage";
//import EventListPage from "./pages/EventListPage";
//import EventViewPage from "./pages/EventViewPage";
import FeedbackPage from "./pages/FeedbackPage";
import LoginPage from "./pages/LoginPage";
//import OrderFoodPage from "./pages/OrderFoodPage";
//import RoomListPage from "./pages/RoomListPage";
//import RoomViewPage from "./pages/RoomViewPage";
import SignupPage from "./pages/SignupPage";
import UserProfilePage from "./pages/UserProfilePage";
//import TakeAwayPage from "./pages/TakeAwayPage";
//import ParkingPage from "./pages/ParkingPage";
import Footer from "./components/CommonComponents/Footer";
import Offers from "./pages/Offers";
import PackageListPage from "./pages/PackagePage";
import PackageView from "./pages/PackageView";



import EmployeeProfile from "./pages/EmployeeProfile";
// import PackageListPage from "./pages/PackageListPage"

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/admin/*" element={<AdminPage />} />
          <Route path="/login" element={<LoginPage />} exact />
          <Route path="/signup" element={<SignupPage />} exact />
          <Route
            path="/*"
            element={
              <>
                <Navbar />
                <div className="main-container-page">
                  <Routes>
                    <Route path="/" element={<HomeScreen />} exact />

                    <Route path="/feedbacks" element={<FeedbackPage />} exact />

                    <Route
                      path="/packages"
                      element={<PackageListPage />}
                      exact
                    />
                    <Route
                      path="/packages/:id"
                      element={<PackageView />}
                      exact
                    />

                    <Route
                      path="/profile"
                      element={<UserProfilePage />}
                      exact
                    />


                    <Route path="/offers" element={<Offers />} exact />
                    <Route
                      path="/employee/profile"
                      element={<EmployeeProfile />}
                      exact
                    />
                  </Routes>
                </div>
                <Footer />
              </>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
