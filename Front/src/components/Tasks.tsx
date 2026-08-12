import React, { useState, useEffect, useCallback, useRef } from 'react';
import TaskPreview from './TaskPreview';
import { useNavigate } from 'react-router-dom';
import { setTasks, removeTask, type ITask } from '../redux/tasksSlice';
import TimedModal from './TimedModal';
import NavBar from './NavBar';
import { apiFetch } from '../utils/api';
import { useAppSelector, useAppDispatch } from '../redux/hooks';


type TaskViewType = 'all' | 'user' | 'history';
const TASKS_LIMIT = 5;

const Tasks: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const currentUser = useAppSelector((state) => state.user.username);
  const tasks = useAppSelector((state) => state.tasks);

  const [isLoading, setIsLoading] = useState(true);
  const [noHistoryOpen, setNoHistoryOpen] = useState(false);
  
  // Pagination & View States
  const [currentView, setCurrentView] = useState<TaskViewType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTasks = useCallback(async (view: TaskViewType, pageToFetch: number) => {
    setIsLoading(true);

    let baseEndpoint = '/api/tasks';
    if (view === 'user') baseEndpoint = '/api/user-tasks';
    if (view === 'history') baseEndpoint = '/api/tasks-history';

    const endpoint = `${baseEndpoint}?page=${pageToFetch}&limit=${TASKS_LIMIT}`;

    try {
      const response = await apiFetch(endpoint, {
        method: 'GET'
      });
      
      const data = await response.json();

      if (response.ok && data.tasks) {
        dispatch(setTasks(data.tasks));
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
        
        if (data.tasks.length === 0 && view === 'history' && pageToFetch === 1) {
          setNoHistoryOpen(true);
        }
      } else {
        console.error("Server returned an error:", data.message || data.error);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  const ranOnceRef = useRef(false);
  useEffect(() => {
    if (ranOnceRef.current) return;
    ranOnceRef.current = true;

    if (currentUser === 'NotLoggedIn') {
      window.alert('Log in first!');
      navigate('/');
      return;
    }
    fetchTasks('all', 1);
  }, [currentUser, navigate, fetchTasks]);

  // Frontend interactions
  const handleViewChange = (view: TaskViewType) => {
    setCurrentView(view);
    fetchTasks(view, 1); 
  };

  const removeTaskFromState = (id: number) => {
    dispatch(removeTask(id));
    fetchTasks(currentView, currentPage);
  };

  return (
    <div className="tasks-bg">
      <div className="tasks-card">
        <NavBar />
        <h2 style={{textAlign: 'center'}}>Hello {currentUser}!</h2>

        <div className='tasksActionsBar'>
          <div className={`optionDiv ${currentView === 'user' ? 'active' : ''}`} onClick={() => handleViewChange('user')}>Show my tasks</div>
          <div className={`optionDiv ${currentView === 'all' ? 'active' : ''}`} onClick={() => handleViewChange('all')}>Show all tasks</div>
          <div className={`optionDiv ${currentView === 'history' ? 'active' : ''}`} onClick={() => handleViewChange('history')}>Tasks history</div>
        </div>

        <div className='flexboxContainerTasks'>
          {tasks.map((task: ITask) => (
            <TaskPreview key={`task-${task.id}`} updateTasks={removeTaskFromState} taskData={task} />
          ))}
          {isLoading ? <div className='tasksMessage'>Loading tasks...</div> : null}
          {tasks.length === 0 && !isLoading ? <div id='noTasksLeft' className='tasksMessage'>NO TASKS FOUND</div> : null}
        </div>

        {/* Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
            <button 
              className='clickbtn' 
              style={{ width: 'auto', padding: '5px 15px', margin: 0 }}
              disabled={currentPage <= 1} 
              onClick={() => fetchTasks(currentView, currentPage - 1)}>
              Prev
            </button>
            <span style={{ fontWeight: 'bold' }}>Page {currentPage} of {totalPages}</span>
            <button 
              className='clickbtn' 
              style={{ width: 'auto', padding: '5px 15px', margin: 0 }}
              disabled={currentPage >= totalPages} 
              onClick={() => fetchTasks(currentView, currentPage + 1)}>
              Next
            </button>
          </div>
        )}
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

export default Tasks;