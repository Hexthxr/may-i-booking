
// import { Routes, Route } from 'react-router-dom';

// import Header from './components/Header';
// import Footer from './components/Footer';

// import Home from './pages/Home';
// import Browse from './pages/Browse';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import BookDetail from './pages/BookDetail';

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

// export default function App() {
//   return (
//     <>
//       {/* ส่วนหัวอยู่ “นอก” <Routes> เสมอ */}
//       <Header />

//       <Routes>
//         {/* สาธารณะ */}
//         <Route path="/" element={<Home />} />
//         <Route path="/category/:name" element={<Browse />} />
//         <Route path="/book/:id" element={<BookDetail />} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/register" element={<Register />} />
//         <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
//         <Route path="/account/address" element={<ProtectedRoute><AddressBook /></ProtectedRoute>} />
//         <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
//         <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
//         <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
//         <Route path="/help" element={<HelpCenter />} />
     
//         {/* ผู้ใช้ทั่วไป (ต้องล็อกอิน) */}
//         <Route
//   path="/profile"
//   element={
//     <ProtectedRoute>
//       <Account />
//     </ProtectedRoute>
//   }
// />

//         {/* แอดมินเท่านั้น */}
//         <Route
//           path="/admin"
//           element={
//             <ProtectedRoute role="admin">
//               <AdminDashboard />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/admin/books"
//           element={
//             <ProtectedRoute role="admin">
//               <AdminBooks />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/admin/books/new"
//           element={
//             <ProtectedRoute role="admin">
//               <AdminBookForm />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/admin/books/:id"
//           element={
//             <ProtectedRoute role="admin">
//               <AdminBookForm />
//             </ProtectedRoute>
//           }
//         />
//       </Routes>

//       {/* ฟุตเตอร์อยู่ “นอก” <Routes> เช่นกัน */}
//       <Footer />
//     </>
//   );
// }

// frontend/src/App.jsx (FORCE Account page for /profile)\
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
import Orders from './pages/Orders.jsx';
import Settings from './pages/Settings.jsx';
import Favorites from './pages/Favorites.jsx';
import HelpCenter from './pages/HelpCenter.jsx';

import AdminDashboard from './pages/AdminDashboard';
import AdminBooks from './pages/AdminBooks';
import AdminBookForm from './pages/AdminBookForm';

import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category/:name" element={<Browse />} />
        <Route path="/book/:id" element={<BookDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Force mapping */}
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
      </Routes>
      <Footer />
    </>
  );
}
