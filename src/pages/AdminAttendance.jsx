import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  UserCheck, 
  UserX,
  History,
  MapPin 
} from 'lucide-react';

// Sub-component for individual rows to handle local state (Address Expansion)
const EmployeeRow = ({ emp, stats, onManualAction }) => {
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);
  const { isWorking, totalTimeStr, locationDisplay, locationType } = stats;

  return (
    <tr className="hover:bg-gray-50 transition border-b border-gray-100 last:border-0">
      {/* Name */}
      <td className="p-4">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs mr-3">
            {emp.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900">{emp.name}</p>
            <p className="text-xs text-gray-400">{emp.employeeId}</p>
          </div>
        </div>
      </td>

      {/* Shift */}
      <td className="p-4">
        <span className="text-xs font-medium text-gray-500">
          {emp.shiftType || 'General'}
        </span>
      </td>

      {/* Status */}
      <td className="p-4">
        {isWorking ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Clock size={12} className="mr-1" /> On Duty
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Off Duty
          </span>
        )}
      </td>

      {/* Location (Interactive: Click to Expand) */}
      <td className="p-4 max-w-xs align-top">
        <div 
          onClick={() => setIsAddressExpanded(!isAddressExpanded)}
          className="flex items-start text-xs text-gray-600 cursor-pointer hover:bg-gray-100 p-2 rounded-md transition-colors" 
          title="Click to expand/collapse full address"
        >
          <MapPin size={14} className={`mr-2 mt-0.5 shrink-0 ${locationType === 'Manual' ? 'text-orange-500' : 'text-blue-500'}`} />
          <span className={`${isAddressExpanded ? 'wrap-break-words whitespace-normal' : 'truncate'} block leading-relaxed`}>
            {locationDisplay}
          </span>
        </div>
      </td>
      
      {/* Hours */}
      <td className="p-4">
        <div className={`flex items-center font-mono font-semibold ${isWorking ? 'text-green-600' : 'text-gray-700'}`}>
            {totalTimeStr}
            {isWorking && <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
        </div>
      </td>

      {/* Actions */}
      <td className="p-4 text-right">
        {isWorking ? (
          <button 
            onClick={() => onManualAction(emp._id, 'out', emp.name)}
            className="text-red-600 hover:text-red-900 text-sm font-medium border border-red-200 px-3 py-1 rounded bg-red-50 hover:bg-red-100 transition"
          >
            Clock Out
          </button>
        ) : (
          <button 
            onClick={() => onManualAction(emp._id, 'in', emp.name)}
            className="text-primary hover:text-green-900 text-sm font-medium border border-secondary px-3 py-1 rounded bg-white hover:bg-green-50 transition"
          >
            Mark Present
          </button>
        )}
      </td>
    </tr>
  );
};

const AdminAttendance = () => {
  const [employees, setEmployees] = useState([]);
  const [todaysLogs, setTodaysLogs] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  // Auto-refresh every minute to update "Live" hours
  useEffect(() => {
    const interval = setInterval(() => setRefresh(prev => prev + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchData();
  }, [refresh]);

  const fetchData = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token;

      // 1. Get All Employees
      const empRes = await fetch('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const empData = await empRes.json();

      // 2. Get Today's Logs
      const attRes = await fetch('http://localhost:5000/api/attendance/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const attData = await attRes.json();

      setEmployees(empData);
      setTodaysLogs(attData); 
      setLoading(false);
    } catch (error) {
      console.error("Error fetching admin data", error);
      setLoading(false);
    }
  };

  const handleManualAction = async (employeeId, action, name) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const token = userInfo?.token;
    
    const reason = prompt(`Reason for manually marking ${name}?`, "No Device / Admin Entry");
    if (!reason) return;

    const endpoint = action === 'in' ? 'manual-in' : 'manual-out';
    
    try {
      const response = await fetch(`http://localhost:5000/api/attendance/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          targetEmployeeId: employeeId,
          workMode: 'Hospital Base', 
          manualReason: reason 
        })
      });

      if (response.ok) {
        setRefresh(prev => prev + 1); 
      } else {
        const err = await response.json();
        alert(err.message);
      }
    } catch (error) {
      alert("Action Failed");
    }
  };

  // --- CALCULATION LOGIC ---
  const getEmployeeStats = (empId) => {
    // Get all sessions for this employee today
    // Note: Backend sorts logs by clockInTime DESC, so index 0 is the latest session
    const userSessions = todaysLogs.filter(log => log.employeeId._id === empId);
    
    const activeSession = userSessions.find(s => s.status === 'Open');
    const isWorking = !!activeSession;

    // --- LOCATION LOGIC ---
    let locationDisplay = '-';
    let locationType = ''; // 'GPS' or 'Manual'

    if (activeSession) {
      // If working, show where they are NOW
      locationDisplay = activeSession.clockInLocation?.address || 'GPS Coordinates';
      locationType = activeSession.isManualEntry ? 'Manual' : 'GPS';
    } else if (userSessions.length > 0) {
      // If off duty, show where they were LAST
      const lastSession = userSessions[0];
      locationDisplay = `Last: ${lastSession.clockInLocation?.address || 'Unknown'}`;
      locationType = lastSession.isManualEntry ? 'Manual' : 'GPS';
    }

    // --- TIME CALCULATION ---
    let totalMinutes = 0;
    userSessions.forEach(session => {
      if (session.status === 'Closed') {
        totalMinutes += session.duration || 0;
      } else if (session.status === 'Open') {
        const start = new Date(session.clockInTime);
        const now = new Date();
        const diffMins = Math.floor((now - start) / 1000 / 60);
        totalMinutes += diffMins;
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    return {
      isWorking,
      activeSession,
      locationDisplay,
      locationType,
      totalTimeStr: `${hours}h ${mins}m`
    };
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Staff Data...</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center">
            <Users className="mr-3" /> Staff Attendance Manager
          </h1>
          <p className="text-gray-500 text-sm">Monitor live status, location, and perform manual entry.</p>
        </div>
        <div className="flex space-x-3">
            <div className="bg-white px-4 py-2 rounded-lg shadow border border-secondary text-sm">
                <span className="font-bold text-primary">{todaysLogs.filter(s => s.status === 'Open').length}</span> On Duty
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow border border-secondary text-sm">
                <span className="font-bold text-gray-600">{employees.length}</span> Total Staff
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-secondary overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Shift</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Hours Today</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.map((emp) => (
              <EmployeeRow 
                key={emp._id} 
                emp={emp} 
                stats={getEmployeeStats(emp._id)} 
                onManualAction={handleManualAction} 
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAttendance;