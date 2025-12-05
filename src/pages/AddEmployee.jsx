import React, { useState } from 'react';
import { UserPlus, Save, AlertCircle, CheckCircle } from 'lucide-react';

const AddEmployee = () => {
  const [formData, setFormData] = useState({
    name: '',
    role: 'doctor',
    department: '',
    password: 'password123', // Default initial password
    shiftType: 'Day Shift',
    // Simple default schedule
    scheduledHours: [
      { day: 'Mon', start: '09:00', end: '17:00' },
      { day: 'Tue', start: '09:00', end: '17:00' },
      { day: 'Wed', start: '09:00', end: '17:00' },
      { day: 'Thu', start: '09:00', end: '17:00' },
      { day: 'Fri', start: '09:00', end: '17:00' },
    ]
  });
  
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Generating Employee ID and creating account...' });

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token;

      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ 
          type: 'success', 
          message: `Success! Employee created with ID: ${data.employeeId}` 
        });
        // Reset name only to allow quick addition of next employee
        setFormData({ ...formData, name: '' });
      } else {
        setStatus({ type: 'error', message: data.message || 'Failed to create user' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Server connection failed' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-8">
        <div className="bg-primary/10 p-3 rounded-full">
          <UserPlus className="text-primary" size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-primary">Register New Employee</h1>
          <p className="text-gray-500 text-sm">Create account, assign role, and generate ID.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-secondary p-8 space-y-6">
        
        {/* Status Message */}
        {status.message && (
          <div className={`p-4 rounded-lg flex items-center space-x-3 ${
            status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
            status.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800'
          }`}>
            {status.type === 'success' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
            <span className="font-medium">{status.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="e.g. Dr. John Doe"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
            <input
              type="text"
              name="department"
              required
              value={formData.department}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="e.g. Cardiology"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition bg-white"
            >
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
              <option value="guard">Guard</option>
              <option value="admin">Admin</option>
              <option value="other">Other Staff</option>
            </select>
          </div>

          {/* Shift Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Default Shift</label>
            <select
              name="shiftType"
              value={formData.shiftType}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition bg-white"
            >
              <option value="Day Shift">Day Shift (9AM - 5PM)</option>
              <option value="Night Shift">Night Shift (9PM - 5AM)</option>
              <option value="Rotational">Rotational</option>
            </select>
          </div>

          {/* Password */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Initial Password</label>
            <input
              type="text"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">Share this password with the employee. They cannot change it yet.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={status.type === 'loading'}
            className={`flex items-center space-x-2 bg-primary text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-opacity-90 transition transform hover:-translate-y-0.5 ${status.type === 'loading' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Save size={20} />
            <span>{status.type === 'loading' ? 'Processing...' : 'Create Employee'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEmployee;