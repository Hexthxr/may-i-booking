// frontend/src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';

import Home from './pages/Home';
import Browse from './pages/Browse';
import Login from './pages/Login';
import Register from './pages/Register';
import BookDetail from './pages/BookDetail';

import Account from './pages/Account.jsx';
import AddressBook from './pages/AddressBook.jsx';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Checkout from './pages/Checkout';
import Cart from './pages/Cart';
import Settings from './pages/Settings.jsx';
import Favorites from './pages/Favorites.jsx';
import HelpCenter from './pages/HelpCenter.jsx';

import AdminDashboard from './pages/AdminDashboard';
import AdminBooks from './pages/AdminBooks';
import AdminBookForm from './pages/AdminBookForm';
import AdminOrders from './pages/AdminOrders.jsx';
import AdminOrderSlip from './pages/AdminOrderSlip.jsx';
import AdminUsers from './pages/AdminUsers.jsx';

import ProtectedRoute from './components/ProtectedRoute';
import Payment from './pages/Payment.jsx';
import SearchResults from './pages/SearchResults.jsx';
import TrackOrder from './pages/TrackOrder.jsx';

import CategoryRedirect from './pages/CategoryRedirect.jsx';

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />

        {/* Browse ทุกหมวด + ผ่าน query */}
        <Route path="/browse" element={<Browse />} />
        <Route path="/browse/:category" element={<Browse />} />
        <Route path="/category/:category" element={<CategoryRedirect />} />

        <Route path="/book/:id" element={<BookDetail />} />
        <Route path="/search" element={<SearchResults />} />

        {/* ✅ เพิ่มอันนี้ เพื่อรองรับ /track?orderId=... */}
        <Route path="/track" element={<TrackOrder />} />
        {/* ของเดิมจะยังใช้ได้เหมือนเดิม */}
        <Route path="/track-order" element={<TrackOrder />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Customer */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />

        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />

        <Route
          path="/account/address"
          element={
            <ProtectedRoute>
              <AddressBook />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route path="/payment" element={<Payment />} />
        <Route path="/cart" element={<Cart />} />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          }
        />
        <Route path="/help" element={<HelpCenter />} />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute role="admin">
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/books"
          element={
            <ProtectedRoute role="admin">
              <AdminBooks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/books/new"
          element={
            <ProtectedRoute role="admin">
              <AdminBookForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/books/:id"
          element={
            <ProtectedRoute role="admin">
              <AdminBookForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute role="admin">
              <AdminOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders/:id/slip"
          element={
            <ProtectedRoute role="admin">
              <AdminOrderSlip />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Footer />
    </>
  );
}
