import React from 'react'
import TaskPreview from './TaskPreview'
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'; 
import { setTasks, removeTask, type ITask } from '../redux/tasksSlice';
import { type RootState } from '../redux/store';
import TimedModal from './TimedModal';
import NavBar from './NavBar';

const Tasks: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate()
  const currentUser = useSelector((state: RootState) => state.user.username);
  const tasks = useSelector((state: RootState) => state.tasks);

  const [isLoading, setIsLoading] = useState(true)
  const [noHistoryOpen, setNoHistoryOpen] = useState(false)

  // Server interaction functions ----------------------------------------------------

  const showAllTasks = useCallback(async () => {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser })
    });
    const data = await response.json();
    dispatch(setTasks(data));
    setIsLoading(false);
  }, [currentUser, dispatch]);

  // Run once in dev despite StrictMode double-invoking effects
  const ranOnceRef = useRef(false);
  useEffect(() => {
    if (ranOnceRef.current) return;   // <-- prevents double execution in dev
    ranOnceRef.current = true;

    if (currentUser === 'NotLoggedIn') {
      window.alert('Log in first!');
      navigate('/');
      return;
    }
    showAllTasks();
  }, [currentUser, navigate, showAllTasks]);

  const showUserTasks = async () => {
    await fetch('/api/user-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser })
    })
    .then(response => response.json())
    .then(data => dispatch(setTasks(data)))
  }

  const showTasksHistory = async () => {
    await fetch('/api/tasks-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser })
    })
    .then(response => response.json())
    .then(data => {
      if (data.length === 0) setNoHistoryOpen(true); 
      else dispatch(setTasks(data))
    })
  }

  // Frontend interaction functions ----------------------------------------------------

  const removeTaskFromState = (id: number) => dispatch(removeTask(id));

  return (
    <div className="tasks-bg">
      <div className="tasks-card">
        <NavBar />
        <h2 style={{textAlign: 'center'}}>Hello {currentUser}!</h2>

        {/* Task action buttons (moved below navbar) */}
        <div className='tasksActionsBar'>
          <div className='optionDiv' onClick={showUserTasks}>Show my tasks</div>
            <div className='optionDiv' onClick={showAllTasks}>Show all tasks</div>
          <div className='optionDiv' onClick={showTasksHistory}>Tasks history</div>
        </div>

        <div className='flexboxContainerTasks'>
          {tasks.map((task: ITask) => (
            <TaskPreview key={`task-${task.id}`} updateTasks={removeTaskFromState} taskData={task} />
          ))}
          {isLoading ? <div className='tasksMessage'>Loading tasks...</div> : null}
          {tasks.length === 0 && !isLoading ? <div id='noTasksLeft' className='tasksMessage'>ALL TASKS ARE DONE!</div> : null}
        </div>
      </div>

      <TimedModal
        open={noHistoryOpen}
        onClose={() => setNoHistoryOpen(false)}
        title="No History"
        message="No tasks history found."
        durationMs={10000}
      />
    </div>
  )
}

export default Tasks
