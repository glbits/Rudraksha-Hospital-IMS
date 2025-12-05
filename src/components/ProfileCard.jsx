import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  CreditCard, 
  Building2, 
  Clock, 
  CalendarDays,
  MapPin,
  Camera,
  Loader2,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

const ProfileCard = ({ user }) => {
  const fileInputRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // State for Toast Notification
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message: '' }

  // Sync state if user prop changes
  useEffect(() => {
    if (user?.photoUrl) {
      setPhotoPreview(user.photoUrl);
    }
  }, [user]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!user) return (
    <div className="animate-pulse bg-white rounded-xl h-96 w-full max-w-3xl mx-auto shadow-sm p-8">
      <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
      <div className="h-8 bg-gray-200 w-1/2 mx-auto rounded"></div>
    </div>
  );

  const handleImageClick = () => {
    if (uploading) return;
    fileInputRef.current.click();
  };

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 1. Size Cap Validation (2MB limit)
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      showToast('error', "File size is too large. Max limit is 2MB.");
      return;
    }

    // 2. Convert to Base64 and Upload
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onloadend = async () => {
      const base64Image = reader.result;
      
      // Optimistic update
      setPhotoPreview(base64Image);
      setUploading(true);

      try {
        const storedInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const token = storedInfo.token || user.token;

        if (!token) {
           showToast('error', "Authentication error. Please login again.");
           return;
        }

        // 3. Send to Backend
        const response = await fetch('http://localhost:5000/api/users/profile/photo', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ photoUrl: base64Image }),
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const updatedData = await response.json();
        
        // Success Toast
        showToast('success', "Profile photo updated successfully!");

        // 4. Update Local Storage
        const newUserInfo = { ...storedInfo, photoUrl: updatedData.photoUrl };
        localStorage.setItem('userInfo', JSON.stringify(newUserInfo));

      } catch (error) {
        console.error("Upload Error:", error);
        showToast('error', "Failed to save photo to database.");
        // Revert to original if failed
        setPhotoPreview(user.photoUrl);
      } finally {
        setUploading(false);
      }
    };
  };

  return (
    <>
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-secondary relative">
        {/* 1. Header Banner */}
        <div className="h-32 bg-primary relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))]from-accent to-transparent"></div>
        </div>

        <div className="px-8 pb-8 relative">
          {/* 2. Profile Image & Header Info */}
          <div className="flex flex-col md:flex-row items-center md:items-end -mt-12 mb-8">
            
            {/* Profile Picture Container */}
            <div className="relative group cursor-pointer" onClick={handleImageClick}>
              <div className={`h-32 w-32 rounded-full border-4 border-white shadow-md bg-secondary flex items-center justify-center overflow-hidden relative ${uploading ? 'opacity-70' : ''}`}>
                {photoPreview ? (
                  <img src={photoPreview} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <User size={64} className="text-accent opacity-50" />
                )}
                
                {/* Overlay */}
                <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200 ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {uploading ? (
                    <Loader2 className="text-white animate-spin" size={24} />
                  ) : (
                    <Camera className="text-white" size={24} />
                  )}
                </div>
              </div>
              
              <div className="absolute bottom-1 right-1 h-6 w-6 bg-green-500 border-2 border-white rounded-full z-10" title="Active"></div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            
            <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left flex-1">
              <h2 className="text-3xl font-bold text-gray-900">{user.name}</h2>
              <div className="flex items-center justify-center md:justify-start space-x-2 text-accent font-medium mt-1">
                <span className="px-2 py-0.5 bg-secondary/50 rounded text-sm uppercase tracking-wide">
                  {user.role}
                </span>
                <span>•</span>
                <span className="text-gray-500">{user.department}</span>
              </div>
            </div>
          </div>

          {/* 3. Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Left Column: Core Info */}
            <div className="bg-background rounded-xl p-6 space-y-4 border border-secondary/50">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Employee Details</h3>
              
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-white rounded-lg shadow-sm text-accent">
                  <CreditCard size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Employee ID</p>
                  <p className="text-gray-900 font-semibold">{user.employeeId}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="p-2 bg-white rounded-lg shadow-sm text-accent">
                  <Building2 size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Department Unit</p>
                  <p className="text-gray-900 font-semibold">{user.department}</p>
                </div>
              </div>

               <div className="flex items-center space-x-4 opacity-70">
                <div className="p-2 bg-white rounded-lg shadow-sm text-accent">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Base Location</p>
                  <p className="text-gray-900 font-semibold">Main Campus</p>
                </div>
              </div>
            </div>

            {/* Right Column: Shift Info */}
            <div className="bg-secondary/30 rounded-xl p-6 space-y-4 border border-secondary/50">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Shift Configuration</h3>
              
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-white rounded-lg shadow-sm text-primary">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Current Assignment</p>
                  <p className="text-primary font-bold">{user.shiftType}</p>
                </div>
              </div>

              <div className="mt-4">
                 <p className="text-xs text-gray-500 font-medium mb-3 flex items-center">
                   <CalendarDays size={14} className="mr-1" /> Weekly Schedule
                 </p>
                 <div className="space-y-2">
                   {user.scheduledHours && user.scheduledHours.map((schedule, index) => (
                     <div key={index} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-secondary/50">
                       <span className="font-semibold text-gray-700 w-12">{schedule.day}</span>
                       <span className="text-gray-500 text-xs">
                         {schedule.start} - {schedule.end}
                       </span>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-6 py-4 rounded-lg shadow-2xl transform transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in ${
          toast.type === 'error' ? 'bg-red-50 dark:bg-red-900 border border-red-200' : 'bg-green-50 dark:bg-green-900 border border-green-200'
        }`}>
          <div className={`${toast.type === 'error' ? 'text-red-500 dark:text-red-300' : 'text-green-500 dark:text-green-300'}`}>
            {toast.type === 'error' ? <AlertCircle size={24} /> : <CheckCircle size={24} />}
          </div>
          <p className={`font-medium ${toast.type === 'error' ? 'text-red-800 dark:text-red-100' : 'text-green-800 dark:text-green-100'}`}>
            {toast.message}
          </p>
          <button onClick={() => setToast(null)} className="ml-4 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
      )}
    </>
  );
};

export default ProfileCard;