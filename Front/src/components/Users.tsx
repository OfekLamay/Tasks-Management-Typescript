import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { type RootState } from '../redux/store';
import NavBar from './NavBar';
import UserPreview from './UserPreview';
import {type IUser} from '../redux/userSlice';

const Users: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => state.user.username);
  const role = useSelector((state: RootState) => state.user.role);
  const teamNumber = useSelector((state: RootState) => state.user.teamNumber);

  const [users, setUsers] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    // Admin sees all users (without passwords) via /api/users-only
    // Others see only their team via /api/team-users-only
    if (role === 'admin') {
      const res = await fetch('/api/users-only');
      const data = await res.json();
      setUsers(data || []);
    } else {
      const res = await fetch('/api/team-users-only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser })
      });
      const data = await res.json();
      setUsers(data || []);
    }
    setIsLoading(false);
  }, [currentUser, role]);

  const ranOnce = useRef(false);
  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    if (currentUser === 'NotLoggedIn') {
      window.alert('Log in first!');
      navigate('/');
      return;
    }
    loadUsers();
  }, [currentUser, navigate, loadUsers]);

  return (
    <div className="users-bg">
      <div className="users-card">
        <NavBar />
        <h2 className="users-title">Hello {currentUser}!</h2>
        <h4 className="users-subtitle">
          Your team number is {teamNumber ?? '—'} and your role is {role}.
        </h4>

        {/* Header row for columns */}
        <div className="usersHeader">
          <div className="usersHeaderCol">User</div>
          <div className="usersHeaderCol">Role</div>
          <div className="usersHeaderCol">Team</div>
        </div>

        <div className="usersList">
          {users.map(u => (
            <UserPreview
              key={`user-${u.username}`}
              userData={u}
              onRefresh={loadUsers}   // <-- pass refresh callback
            />
          ))}
          {isLoading ? <div className='usersMessage'>Loading users...</div> : null}
          {!isLoading && users.length === 0 ? <div className='usersMessage'>No users found</div> : null}
        </div>
      </div>
    </div>
  );
};

export default Users;
