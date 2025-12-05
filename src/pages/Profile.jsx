import React, { useEffect, useState } from 'react';
import ProfileCard from '../components/ProfileCard';

const Profile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // We assume the user is logged in because the Layout protects this route
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
  }, []);

  if (!user) return <div className="text-primary">Loading profile data...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md shadow-sm">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Shift Status</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>You are currently assigned to the <strong>{user.shiftType}</strong>.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reusing your existing ProfileCard */}
      <ProfileCard user={user} />
    </div>
  );
};

export default Profile;