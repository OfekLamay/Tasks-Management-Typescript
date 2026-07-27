import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout as logoutAction } from '../redux/userSlice';
import { setTasks } from '../redux/tasksSlice';
import { type RootState } from '../redux/store';

const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.user.username);

  const handleLogout = () => {
    if (currentUser === 'NotLoggedIn') return navigate('/');
    dispatch(setTasks([]));
    dispatch(logoutAction());
    navigate('/');
  };

  return (
    <div className='mainNavBar'>
      <div className='navLink' onClick={() => navigate('/tasks')}>Tasks</div>
      <div className='navLink' onClick={() => navigate('/newTask')}>New Task</div>
      <div className='navLink' onClick={() => navigate('/users')}>Users</div>
      {currentUser !== 'NotLoggedIn' && (
        <div className='navLink' onClick={handleLogout}>Exit</div>
      )}
    </div>
  );
};

export default NavBar;
