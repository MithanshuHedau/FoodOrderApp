import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Orders from "./pages/Orders.jsx";
import Home from "./pages/Home.jsx";
import RestaurantDetails from "./pages/RestaurantDetails.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Profile from "./pages/Profile.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ManageRestaurants from "./pages/ManageRestaurants.jsx";
import ManageCategories from "./pages/ManageCategories.jsx";
import ManageMenuItems from "./pages/ManageMenuItems.jsx";
import ManageUsers from "./pages/ManageUsers.jsx";
// Global styles now provided by Tailwind (see index.css)

const App = () => {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/restaurants/:id" element={<RestaurantDetails />} />

            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/restaurants" element={<ManageRestaurants />} />
            <Route path="/admin/categories" element={<ManageCategories />} />
            <Route path="/admin/menu" element={<ManageMenuItems />} />
            <Route path="/admin/users" element={<ManageUsers />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
