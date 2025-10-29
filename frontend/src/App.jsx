
// import { Routes, Route } from 'react-router-dom';
// import Header from './components/Header';
// import Footer from './components/Footer';

// import Home from './pages/Home';
// import Browse from './pages/Browse';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import BookDetail from './pages/BookDetail';          // ✅ import แค่ครั้งเดียว

// import Account from './pages/Account.jsx';
// import AddressBook from './pages/AddressBook.jsx';
// import Orders from './pages/Orders.jsx';
// import Settings from './pages/Settings.jsx';
// import Favorites from './pages/Favorites.jsx';
// import HelpCenter from './pages/HelpCenter.jsx';

// import AdminDashboard from './pages/AdminDashboard';
// import AdminBooks from './pages/AdminBooks';
// import AdminBookForm from './pages/AdminBookForm';

// import ProtectedRoute from './components/ProtectedRoute';

// import SearchResults from './pages/SearchResults';     // ✅ import ครั้งเดียว

// export default function App() {
//   return (
//     <>
//       <Header />
//       <Routes>
//         <Route path="/" element={<Home />} />
//         <Route path="/category/:name" element={<Browse />} />

//         {/* ✅ ใช้เส้นทางเดียวให้ชัดเจน */}
//         <Route path="/books/:id" element={<BookDetail />} />

//         <Route path="/login" element={<Login />} />
//         <Route path="/register" element={<Register />} />
//         <Route path="/search" element={<SearchResults />} />

//         {/* Force mapping */}
//         <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
//         <Route path="/profile" element={<ProtectedRoute><Account /></ProtectedRoute>} />
//         <Route path="/account/address" element={<ProtectedRoute><AddressBook /></ProtectedRoute>} />
//         <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
//         <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
//         <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
//         <Route path="/help" element={<HelpCenter />} />

//         {/* Admin */}
//         <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
//         <Route path="/admin/books" element={<ProtectedRoute role="admin"><AdminBooks /></ProtectedRoute>} />
//         <Route path="/admin/books/new" element={<ProtectedRoute role="admin"><AdminBookForm /></ProtectedRoute>} />
//         <Route path="/admin/books/:id" element={<ProtectedRoute role="admin"><AdminBookForm /></ProtectedRoute>} />
//       </Routes>
//       <Footer />
//     </>
//   );
// }

import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';

import Home from './pages/Home';
import Browse from './pages/Browse';
import Login from './pages/Login';
import Register from './pages/Register';
import BookDetail from './pages/BookDetail';          // ✅ import แค่ครั้งเดียว

import Account from './pages/Account.jsx';
import AddressBook from './pages/AddressBook.jsx';
import Orders from './pages/Orders.jsx';
import Settings from './pages/Settings.jsx';
import Favorites from './pages/Favorites.jsx';
import HelpCenter from './pages/HelpCenter.jsx';

import AdminDashboard from './pages/AdminDashboard';
import AdminBooks from './pages/AdminBooks';
import AdminBookForm from './pages/AdminBookForm';

import ProtectedRoute from './components/ProtectedRoute';

import SearchResults from './pages/SearchResults';     // ✅ import ครั้งเดียว

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/category/:name" element={<Browse />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Book detail: ใช้เส้นทางเดียวให้ชัดเจน */}
        <Route path="/books/:id" element={<BookDetail />} />
        {/* Redirect กันพลาดจากลิงก์เก่า /book/:id */}
        <Route path="/book/:id" element={<Navigate to="/books/:id" replace />} />

        {/* Account */}
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/account/address" element={<ProtectedRoute><AddressBook /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="/help" element={<HelpCenter />} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/books" element={<ProtectedRoute role="admin"><AdminBooks /></ProtectedRoute>} />
        <Route path="/admin/books/new" element={<ProtectedRoute role="admin"><AdminBookForm /></ProtectedRoute>} />
        <Route path="/admin/books/:id" element={<ProtectedRoute role="admin"><AdminBookForm /></ProtectedRoute>} />

        {/* (Optional) 404 */}
        {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
      </Routes>
      <Footer />
    </>
  );
}
