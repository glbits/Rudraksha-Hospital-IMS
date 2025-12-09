import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client'; // Import Socket.io
import { 
  Stethoscope, AlertCircle, Clock, CheckCircle, 
  MapPin, Activity, Plus, User, XCircle, ShieldAlert, RefreshCw
} from 'lucide-react';

const DoctorRequests = () => {
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [checkingAttendance, setCheckingAttendance] = useState(true);
  
  const [formData, setFormData] = useState({
    location: '', taskType: 'General Assistance', priority: 'Routine', note: ''
  });

  useEffect(() => {
    checkAttendanceStatus();
    fetchRequests();

    // SETUP SOCKET LISTENER
    const socket = io('http://localhost:5000');
    
    // Listen for updates to MY requests
    socket.on('request_accepted', (updatedReq) => {
      setMyRequests(prev => prev.map(req => req._id === updatedReq._id ? updatedReq : req));
    });

    socket.on('request_completed', (updatedReq) => {
      setMyRequests(prev => prev.map(req => req._id === updatedReq._id ? updatedReq : req));
    });

    return () => socket.disconnect();
  }, []);

  const checkAttendanceStatus = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const response = await fetch('http://localhost:5000/api/attendance/status', {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      const data = await response.json();
      setIsClockedIn(data.status === 'Open');
      setCheckingAttendance(false);
    } catch (error) {
      setCheckingAttendance(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const response = await fetch('http://localhost:5000/api/requests/my', {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      const data = await response.json();
      setMyRequests(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load requests", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Frontend Check
    if (!isClockedIn) {
      alert("System Block: You must Clock In before making requests.");
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const response = await fetch('http://localhost:5000/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo.token}` },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({ location: '', taskType: 'General Assistance', priority: 'Routine', note: '' });
        // Add new request to top of list immediately
        setMyRequests(prev => [data, ...prev]);
      } else {
        const err = await response.json();
        alert(err.message);
      }
    } catch (error) { console.error(error); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this request? Nurses will no longer see it.")) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const response = await fetch(`http://localhost:5000/api/requests/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      if (response.ok) {
        // Remove locally immediately
        setMyRequests(prev => prev.filter(r => r._id !== id));
      } else {
        const err = await response.json();
        alert(err.message);
      }
    } catch (error) { alert("Failed to cancel"); }
  };

  const getPriorityColor = (p) => {
    switch(p) {
      case 'Emergency': return 'bg-red-100 text-red-700 border-red-200 animate-pulse';
      case 'Urgent': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  if (checkingAttendance) return <div className="p-8 text-center">Verifying Doctor Status...</div>;

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Request Form */}
      <div className="lg:col-span-1">
        {!isClockedIn && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start space-x-3">
            <ShieldAlert className="text-red-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="text-red-800 font-bold text-sm">NOT CLOCKED IN</h3>
              <p className="text-red-600 text-xs mt-1">You must start your shift in the "Attendance" module first.</p>
              <button onClick={checkAttendanceStatus} className="mt-2 text-xs font-bold text-red-700 underline flex items-center">
                <RefreshCw size={12} className="mr-1"/> Re-check Status
              </button>
            </div>
          </div>
        )}

        <div className={`bg-white rounded-2xl shadow-lg border border-secondary overflow-hidden sticky top-6 ${!isClockedIn ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
          <div className="bg-primary p-6 text-white">
            <h2 className="text-xl font-bold flex items-center"><Plus className="mr-2" /> Request Nurse</h2>
            <p className="text-sm opacity-80 mt-1">Broadcast to ALL available nurses.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Urgency Level</label>
              <div className="grid grid-cols-3 gap-2">
                {['Routine', 'Urgent', 'Emergency'].map(level => (
                  <button key={level} type="button" onClick={() => setFormData({...formData, priority: level})} className={`py-2 px-1 rounded-lg text-sm font-bold border transition ${formData.priority === level ? (level === 'Emergency' ? 'bg-red-600 text-white border-red-600' : 'bg-primary text-white border-primary') : 'bg-white text-gray-600 hover:bg-gray-50'}`}>{level}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                <input type="text" placeholder="e.g. Ward 4, Bed 12" required className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:outline-none" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Task Type</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:outline-none bg-white" value={formData.taskType} onChange={e => setFormData({...formData, taskType: e.target.value})}>
                <option>General Assistance</option><option>IV / Injection</option><option>Vitals Check</option><option>Patient Transport</option><option>Code Blue</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Note (Optional)</label>
              <textarea rows="3" placeholder="Specific instructions..." className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:outline-none" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})}></textarea>
            </div>
            <button type="submit" className={`w-full py-3 rounded-lg font-bold text-white shadow-md transition transform hover:-translate-y-0.5 ${formData.priority === 'Emergency' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-green-800'}`}>Broadcast Request</button>
          </form>
        </div>
      </div>

      {/* History */}
      <div className="lg:col-span-2 space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center"><Activity className="mr-2 text-primary" /> Active Requests</h2>
        {loading ? <p>Loading...</p> : myRequests.length === 0 ? (
          <div className="text-center p-12 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">No active requests.</div>
        ) : (
          <div className="space-y-4">
            {myRequests.map(req => (
              <div key={req._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition animate-in fade-in duration-300">
                <div className="space-y-2 mb-4 md:mb-0">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getPriorityColor(req.priority)}`}>{req.priority}</span>
                    <h3 className="font-bold text-gray-800">{req.taskType}</h3>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin size={16} className="mr-1 text-gray-400"/> {req.location}
                    <span className="mx-2">•</span>
                    <Clock size={16} className="mr-1 text-gray-400"/> {new Date(req.createdAt).toLocaleTimeString()}
                  </div>
                  {req.note && <p className="text-sm text-gray-500 italic">"{req.note}"</p>}
                </div>
                <div className="flex flex-col items-end space-y-2">
                  {req.status === 'Pending' && (
                    <>
                      <div className="flex items-center text-orange-600 bg-orange-50 px-4 py-2 rounded-lg animate-pulse"><AlertCircle size={20} className="mr-2" /><span className="font-bold text-sm">Searching...</span></div>
                      <button onClick={() => handleCancel(req._id)} className="text-xs text-red-500 hover:underline flex items-center"><XCircle size={12} className="mr-1"/> Cancel</button>
                    </>
                  )}
                  {req.status === 'Accepted' && (
                    <div className="flex items-center text-blue-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                      <div className="mr-3 text-right"><p className="text-xs font-bold uppercase text-blue-400">Accepted By</p><p className="font-bold text-sm">{req.assignedNurseName || 'Nurse'}</p></div>
                      <User size={32} className="bg-blue-200 p-1.5 rounded-full text-blue-700" />
                    </div>
                  )}
                  {req.status === 'Completed' && (
                    <div className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-100 opacity-70"><CheckCircle size={20} className="mr-2" /><span className="font-bold text-sm">Completed</span></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorRequests;