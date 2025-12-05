import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Profile from './pages/Profile';
import AddEmployee from './pages/AddEmployee';
import Attendance from './pages/Attendance'; 
import Layout from './components/Layout';
import AdminAttendance from './pages/AdminAttendance';

const PrivateRoute = ({ children }) => {
  const userInfo = localStorage.getItem('userInfo');
  return userInfo ? children : <Navigate to="/login" />;
};

const Dashboard = () => (
  <div className="bg-white p-6 rounded-xl shadow-md">
    <h3 className="text-lg font-bold text-gray-800">Welcome to IMS Dashboard</h3>
    <p className="text-gray-600 mt-2">Select an option from the sidebar to begin.</p>
  </div>
);

// Deleted the inline Attendance component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin-attendance" element={<AdminAttendance />} />
          <Route path="/attendance" element={<Attendance />} /> 
          <Route path="/add-employee" element={<AddEmployee />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;