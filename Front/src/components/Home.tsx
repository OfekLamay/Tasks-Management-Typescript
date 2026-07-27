import React from 'react'
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/userSlice';
import { useNavigate } from 'react-router-dom';


const Home: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Server interactions functions ----------------------------------------------------

  const checkLogin = async (username: string, password: string) => {
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uName: username, uPass: password })
    }).then(r => r.json());

    if (res.isLogin) {
        dispatch(setUser({ username, role: res.role, teamNumber: res.teamNumber }));
        navigate('/tasks');
    } else {
        alert(res.message);
    }
  }

  // Frontend interactions functions --------------------------------------------------

  const logIn = () => {
    let uName = document.getElementById('username') as HTMLInputElement;
    let uPassword = document.getElementById('password') as HTMLInputElement;
    checkLogin(uName.value, uPassword.value)
  }

  return (
    <div className="home-bg">
      <div className="home-card">
        <h2>👋 Welcome to Tasks Management</h2>
        <div className='home-form'>
          <input id='username' type="text" className='inputLabel' placeholder='User name' />
          <input id='password' type="password" className='inputLabel' placeholder='Password' />
          <button onClick={logIn} className='clickbtn home-btn'>Log In</button>
        </div>
      </div>
    </div>
  )
}

export default Home;
