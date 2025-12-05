import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  Navigation, 
  AlertTriangle, 
  CheckCircle, 
  Briefcase 
} from 'lucide-react';

const Attendance = () => {
  const [status, setStatus] = useState('loading'); // 'loading', 'Closed', 'Open'
  const [session, setSession] = useState(null);
  const [location, setLocation] = useState({ 
    latitude: null, 
    longitude: null, 
    address: '', 
    error: '' 
  });
  
  // Form State for Clock In
  const [workMode, setWorkMode] = useState('Hospital Base');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Timer State
  const [elapsedTime, setElapsedTime] = useState('00h 00m 00s');

  // 1. Fetch Status on Load
  useEffect(() => {
    fetchStatus();
  }, []);

  // 2. Timer Logic
  useEffect(() => {
    let interval;
    if (status === 'Open' && session?.clockInTime) {
      interval = setInterval(() => {
        const start = new Date(session.clockInTime);
        const now = new Date();
        const diff = now - start;
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setElapsedTime(
          `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
        );
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, session]);

  const fetchStatus = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const response = await fetch('http://localhost:5000/api/attendance/status', {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      const data = await response.json();
      setStatus(data.status);
      setSession(data.session);
    } catch (error) {
      console.error("Failed to fetch status", error);
    }
  };

  // 3. Get GPS Location & Address
  const getLocation = () => {
    setLoading(true);
    setLocation({ ...location, error: '' });

    if (!navigator.geolocation) {
      setLocation({ ...location, error: 'Geolocation is not supported by your browser' });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse Geocoding via OpenStreetMap (Nominatim)
          // Note: In production, cache this or use a paid service to avoid rate limits
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          setLocation({
            latitude,
            longitude,
            address: data.display_name || 'Unknown Location',
            error: ''
          });
        } catch (err) {
          setLocation({
            latitude,
            longitude,
            address: 'GPS Captured (Address lookup failed)',
            error: ''
          });
        }
        setLoading(false);
      },
      (error) => {
        setLocation({ ...location, error: 'Unable to retrieve your location' });
        setLoading(false);
      }
    );
  };

  const handleClockIn = async (e) => {
    e.preventDefault();
    if (!location.latitude) return alert("Please capture your location first.");

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const response = await fetch('http://localhost:5000/api/attendance/clock-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          workMode,
          note
        })
      });
      
      if (response.ok) {
        fetchStatus(); // Refresh UI
      } else {
        const err = await response.json();
        alert(err.message);
      }
    } catch (error) {
      alert("Clock In Failed");
    }
  };

  const handleClockOut = async () => {
    // We need location for clock out too
    if (!navigator.geolocation) return alert("Geolocation needed for clock out");

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const response = await fetch('http://localhost:5000/api/attendance/clock-out', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo.token}`
          },
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: "Clock Out Location" // Ideally fetch address again here
          })
        });

        if (response.ok) {
          fetchStatus(); // Refresh UI
          // Reset local state
          setLocation({ latitude: null, longitude: null, address: '', error: '' });
          setNote('');
        }
      } catch (error) {
        alert("Clock Out Failed");
      }
    });
  };

  if (status === 'loading') return <div className="p-8 text-center text-gray-500">Loading Attendance Data...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Header Stats */}
      <div className="bg-primary text-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Clock size={120} />
        </div>
        
        <h2 className="text-sm uppercase tracking-wider opacity-80 mb-1">Current Status</h2>
        <div className="flex items-center space-x-3 mb-6">
          <div className={`h-4 w-4 rounded-full ${status === 'Open' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
          <span className="text-3xl font-bold">{status === 'Open' ? 'ON DUTY' : 'OFF DUTY'}</span>
        </div>

        {status === 'Open' && (
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
            <p className="text-sm opacity-80 mb-1">Time Elapsed</p>
            <p className="text-4xl font-mono font-bold tracking-widest">{elapsedTime}</p>
          </div>
        )}
      </div>

      {/* ACTION AREA */}
      {status === 'Closed' ? (
        <div className="bg-white rounded-xl shadow-lg border border-secondary p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <Navigation className="mr-2 text-primary" size={20} /> Start Your Shift
          </h3>

          {/* Location Capture Step */}
          <div className="mb-6">
             {!location.latitude ? (
               <button 
                 onClick={getLocation} 
                 disabled={loading}
                 className="w-full py-3 border-2 border-dashed border-primary/50 rounded-lg text-primary font-semibold hover:bg-primary/5 transition flex items-center justify-center"
               >
                 {loading ? "Locating..." : "📍 Click to Detect Location"}
               </button>
             ) : (
               <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start space-x-3">
                 <CheckCircle className="text-green-600 mt-1" size={18} />
                 <div>
                   <p className="text-xs text-green-800 font-bold uppercase">Location Captured</p>
                   <p className="text-sm text-gray-700">{location.address}</p>
                 </div>
               </div>
             )}
             {location.error && <p className="text-red-500 text-sm mt-2 flex items-center"><AlertTriangle size={14} className="mr-1"/> {location.error}</p>}
          </div>

          <form onSubmit={handleClockIn} className="space-y-4">
             {/* Work Mode */}
             <div>
               <label className="block text-sm font-semibold text-gray-700 mb-2">Work Mode</label>
               <div className="grid grid-cols-2 gap-3">
                 {['Hospital Base', 'Field Duty', 'Camp/Event', 'Training'].map((mode) => (
                   <button
                     type="button"
                     key={mode}
                     onClick={() => setWorkMode(mode)}
                     className={`py-2 px-3 rounded-lg text-sm font-medium border transition ${
                       workMode === mode 
                       ? 'bg-primary text-white border-primary' 
                       : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                     }`}
                   >
                     {mode}
                   </button>
                 ))}
               </div>
             </div>

             {/* Note */}
             <div>
               <label className="block text-sm font-semibold text-gray-700 mb-2">Note (Optional)</label>
               <input 
                 type="text" 
                 value={note}
                 onChange={(e) => setNote(e.target.value)}
                 placeholder="e.g. Reporting to Ward 4"
                 className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
               />
             </div>

             <button 
               type="submit"
               disabled={!location.latitude}
               className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition transform hover:-translate-y-0.5 ${
                 !location.latitude ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'
               }`}
             >
               Clock In
             </button>
          </form>
        </div>
      ) : (
        /* CLOCK OUT VIEW */
        <div className="bg-white rounded-xl shadow-lg border border-secondary p-6">
           <div className="mb-6 space-y-3">
             <div className="flex items-center text-sm text-gray-600">
               <Briefcase size={16} className="mr-2 text-primary" />
               <span className="font-semibold mr-2">Work Mode:</span> {session?.workMode}
             </div>
             <div className="flex items-center text-sm text-gray-600">
               <MapPin size={16} className="mr-2 text-primary" />
               <span className="font-semibold mr-2">Start Location:</span> 
               <span className="truncate">{session?.clockInLocation?.address || 'GPS Coordinates'}</span>
             </div>
             <div className="flex items-center text-sm text-gray-600">
               <Clock size={16} className="mr-2 text-primary" />
               <span className="font-semibold mr-2">Started at:</span> 
               {new Date(session?.clockInTime).toLocaleTimeString()}
             </div>
           </div>

           <button 
             onClick={handleClockOut}
             className="w-full py-3 rounded-lg font-bold text-white bg-red-500 shadow-lg hover:bg-red-600 transition transform hover:-translate-y-0.5"
           >
             Clock Out
           </button>
        </div>
      )}
    </div>
  );
};

export default Attendance;