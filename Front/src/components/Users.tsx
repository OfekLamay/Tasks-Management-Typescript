import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import UserPreview from './UserPreview';
import { type IUser } from '../redux/userSlice';
import { apiFetch } from '../utils/api';
import { useAppSelector } from '../redux/hooks';


const Users: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAppSelector((state) => state.user.username);
  const role = useAppSelector((state) => state.user.role);
  const teamNumber = useAppSelector((state) => state.user.teamNumber);

  const [users, setUsers] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const USERS_LIMIT = 5;

  const loadUsers = useCallback(async (pageToFetch: number = 1) => {
    setIsLoading(true);
    try {
      if (role === 'admin') {
        const res = await apiFetch(`/api/users-only?page=${pageToFetch}&limit=${USERS_LIMIT}`);
        const data = await res.json();
        if (data.users) {
            setUsers(data.users);
            setCurrentPage(data.currentPage);
            setTotalPages(data.totalPages);
        }
      } else {
        const res = await apiFetch(`/api/team-users-only?page=${pageToFetch}&limit=${USERS_LIMIT}`, {
          method: 'GET',
        });
        const data = await res.json();
        if (data.users) {
            setUsers(data.users);
            setCurrentPage(data.currentPage);
            setTotalPages(data.totalPages);
        }
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  }, [role, USERS_LIMIT]);

  const ranOnce = useRef(false);
  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    if (currentUser === 'NotLoggedIn') {
      window.alert('Log in first!');
      navigate('/');
      return;
    }
    loadUsers(1);
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
              onRefresh={() => loadUsers(currentPage)}
            />
          ))}
          {isLoading ? <div className='usersMessage'>Loading users...</div> : null}
          {!isLoading && users.length === 0 ? <div className='usersMessage'>No users found</div> : null}
        </div>

        {/* Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
            <button 
              className='clickbtn' 
              style={{ width: 'auto', padding: '5px 15px', margin: 0 }}
              disabled={currentPage <= 1} 
              onClick={() => loadUsers(currentPage - 1)}>
              Prev
            </button>
            <span style={{ fontWeight: 'bold' }}>Page {currentPage} of {totalPages}</span>
            <button 
              className='clickbtn' 
              style={{ width: 'auto', padding: '5px 15px', margin: 0 }}
              disabled={currentPage >= totalPages} 
              onClick={() => loadUsers(currentPage + 1)}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;