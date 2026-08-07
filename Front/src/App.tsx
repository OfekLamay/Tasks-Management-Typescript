import React from 'react';
import './App.css';
import { Route, Routes } from 'react-router-dom';

import Home from './components/Home';
import Tasks from './components/Tasks';
import NewTask from './components/NewTask';
import NotFound from './components/NotFound';
import Users from './components/Users';
import { useAuth } from './hooks/useAuth'; 

const App: React.FC = () => {
  const { isVerifying } = useAuth();

  if (isVerifying) {
    return <div className="loading-screen">Loading application...</div>;
  }
  
  return (
    <div className="App">
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/tasks' element={<Tasks />} />
        <Route path='/newTask' element={<NewTask />} />
        <Route path='/users' element={<Users />} />
        {/* All other undefined routes */}
        <Route path='*' element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;