import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client'; 
import { 
  ClipboardList, CheckCircle, AlertOctagon, 
  MapPin, Clock, User, ArrowRight, Trophy 
} from 'lucide-react';

const NurseDashboard = () => {
  const [activeTab, setActiveTab] = useState('pool'); 
  const [pool, setPool] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [refresh, setRefresh] = useState(0); // Trigger for re-fetching
  
  // Socket Ref
  const [socket, setSocket] = useState(null);

  // 1. Initial Fetch & Poll
  useEffect(() => {
    fetchData(); // Fetch immediately on mount or refresh
  }, [refresh]); // Dependency on 'refresh' ensures updates work

  // Poll for new tasks every 10 seconds (backup to sockets)
  useEffect(() => {
    const interval = setInterval(() => setRefresh(prev => prev + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  // 2. Setup Real-Time Listener
  useEffect(() => {
    const newSocket = io('http://localhost:5000'); 
    setSocket(newSocket);

    // LISTEN: New Request Created
    newSocket.on('new_request', (request) => {
      // Add to pool immediately
      setPool(prev => [request, ...prev]);
    });

    // LISTEN: Request Taken or Cancelled
    newSocket.on('request_accepted', (updatedReq) => {
      // Remove from pool
      setPool(prev => prev.filter(r => r._id !== updatedReq._id));
      
      // If *I* accepted it (via another tab/device), update my tasks too
      // (Though usually handleAccept does this locally)
    });

    newSocket.on('request_cancelled', (cancelledReq) => {
      setPool(prev => prev.filter(r => r._id !== cancelledReq._id));
    });

    return () => newSocket.disconnect();
  }, []);

  const fetchData = async () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo) return;
    
    const headers = { Authorization: `Bearer ${userInfo.token}` };

    try {
      // CRITICAL FIX: Always fetch BOTH endpoints so stats are accurate immediately
      const [poolRes, myRes] = await Promise.all([
        fetch('http://localhost:5000/api/requests/pool', { headers }),
        fetch('http://localhost:5000/api/requests/my', { headers })
      ]);

      if (poolRes.ok) setPool(await poolRes.json());
      if (myRes.ok) setMyTasks(await myRes.json());

    } catch (error) {
      console.error("Dashboard fetch error:", error);
    }
  };

  const handleAccept = async (id) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    try {
      const res = await fetch(`http://localhost:5000/api/requests/${id}/accept`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      if (res.ok) {
        alert("Task Accepted! Moved to 'My Active Tasks'");
        // Refresh everything to sync state perfectly
        setRefresh(prev => prev + 1);
        setActiveTab('my-tasks');
      } else {
        alert("Task already taken by another nurse.");
        setRefresh(prev => prev + 1);
      }
    } catch (err) { alert("Error accepting task"); }
  };

  const handleComplete = async (id) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    try {
      const res = await fetch(`http://localhost:5000/api/requests/${id}/complete`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      if (res.ok) {
        setRefresh(prev => prev + 1); // Updates stats immediately
      }
    } catch (err) { alert("Error completing task"); }
  };

  // Helper for priority display
  const PriorityBadge = ({ p }) => {
    const colors = {
      Emergency: 'bg-red-500 text-white animate-pulse',
      Urgent: 'bg-orange-500 text-white',
      Routine: 'bg-blue-100 text-blue-700'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${colors[p] || colors.Routine}`}>
        {p}
      </span>
    );
  };

  // Calculate Stats (Correctly uses loaded myTasks)
  const completedToday = myTasks.filter(t => t.status === 'Completed').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* GAMIFICATION HEADER */}
      <div className="bg-gradient-to-r from-primary to-green-800 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <ClipboardList className="mr-3 h-8 w-8" /> Nurse Station
          </h1>
          <p className="opacity-80 text-sm mt-1">Pick up tasks, help doctors, earn credit.</p>
        </div>
        <div className="text-center bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20 min-w-[140px]">
          <div className="flex items-center justify-center space-x-2 text-yellow-300 mb-1">
            <Trophy size={18} />
            <span className="font-bold text-xs uppercase tracking-wide">Performance</span>
          </div>
          <div className="text-3xl font-extrabold">{completedToday}</div>
          <div className="text-xs opacity-75">Tasks Done Today</div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex space-x-2 bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-fit">
        <button 
          onClick={() => setActiveTab('pool')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'pool' ? 'bg-primary text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          Open Requests <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs animate-pulse">{pool.length}</span>
        </button>
        <button 
          onClick={() => setActiveTab('my-tasks')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'my-tasks' ? 'bg-primary text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          My Active Tasks
        </button>
      </div>

      {/* TASK LIST AREA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* --- POOL VIEW --- */}
        {activeTab === 'pool' && (
          pool.length === 0 ? (
            <div className="col-span-2 text-center p-12 bg-white rounded-xl border border-dashed text-gray-400">
              No pending requests. Standby.
            </div>
          ) : (
            pool.map(task => (
              <div key={task._id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition group animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-start mb-4">
                  <PriorityBadge p={task.priority} />
                  <div className="text-xs font-mono text-gray-400">{new Date(task.createdAt).toLocaleTimeString()}</div>
                </div>
                
                <h3 className="text-lg font-bold text-gray-800 mb-1">{task.taskType}</h3>
                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <MapPin size={16} className="mr-1 text-primary"/> {task.location}
                  <span className="mx-2">•</span>
                  <User size={16} className="mr-1 text-gray-400"/> Dr. {task.requesterName}
                </div>
                
                {task.note && (
                  <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 mb-4 italic">
                    "{task.note}"
                  </div>
                )}

                <button 
                  onClick={() => handleAccept(task._id)}
                  className="w-full py-3 bg-white border-2 border-primary text-primary font-bold rounded-lg group-hover:bg-primary group-hover:text-white transition flex justify-center items-center"
                >
                  Accept Task <ArrowRight size={18} className="ml-2"/>
                </button>
              </div>
            ))
          )
        )}

        {/* --- MY TASKS VIEW --- */}
        {activeTab === 'my-tasks' && (
          myTasks.filter(t => t.status !== 'Completed').length === 0 ? (
            <div className="col-span-2 text-center p-12 bg-white rounded-xl border border-dashed text-gray-400">
              You have no active tasks. Go to "Open Requests" to pick one up!
            </div>
          ) : (
            myTasks.filter(t => t.status === 'Accepted').map(task => (
              <div key={task._id} className="bg-blue-50 rounded-xl p-6 shadow-sm border border-blue-200 relative overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs font-bold uppercase">In Progress</span>
                  <div className="text-xs font-mono text-blue-600">Started: {new Date(task.acceptedAt).toLocaleTimeString()}</div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-1 relative z-10">{task.taskType}</h3>
                <div className="flex items-center text-sm text-gray-700 mb-6 relative z-10">
                  <MapPin size={16} className="mr-1"/> {task.location} (Dr. {task.requesterName})
                </div>

                <button 
                  onClick={() => handleComplete(task._id)}
                  className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md transition flex justify-center items-center relative z-10"
                >
                  <CheckCircle size={20} className="mr-2"/> Mark Complete
                </button>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default NurseDashboard;