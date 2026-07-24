import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="notfound-bg">
      <div className="notfound-card">
        <h2>404 • Page not found</h2>
        <p>This page doesn’t exist or is not part of the app.</p>
        <button className="clickbtn" onClick={() => navigate('/')}>Go to Home</button>
      </div>
    </div>
  );
};

export default NotFound;