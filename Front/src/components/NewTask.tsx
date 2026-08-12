import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SelectOptions from './SelectOptions';
import type { IUser } from '../redux/userSlice';
import { apiFetch } from '../utils/api';
import { useAppSelector } from '../redux/hooks';


const MAX_USERS_FETCH = 1000;

const NewTask: React.FC = () => {
    const navigate = useNavigate();
    const { username: currentUser } = useAppSelector((state) => state.user);
    const [users, setUsers] = useState<IUser[]>([]);
    const ranOnceRef = useRef(false);

    // Guard + fetch team users (once)
    useEffect(() => {
        if (ranOnceRef.current) return;
        ranOnceRef.current = true;

        if (currentUser === 'NotLoggedIn') {
            window.alert('Log in first!');
            navigate('/');
            return;
        }

        const fetchTeamUsers = async () => {
            try {
                const response = await apiFetch(`/api/team-users-only?page=1&limit=${MAX_USERS_FETCH}`, {
                    method: 'GET',
                });
                
                const data = await response.json();
                
                if (response.ok && data.users) {
                    setUsers(data.users);
                } else {
                    setUsers([]);
                }
            } catch (error) {
                console.error("Failed to fetch team users:", error);
                setUsers([]);
            }
        };

        fetchTeamUsers();
    }, [currentUser, navigate]);

    const createTask = async () => {
        if (currentUser === 'NotLoggedIn') {
            window.alert('Log in first!');
            navigate('/');
            return;
        }

        const taskName = (document.getElementById('name') as HTMLInputElement).value;
        const description = (document.getElementById('description') as HTMLTextAreaElement).value;
        const userRelated = (document.getElementById('selectUser') as HTMLSelectElement).value;
        const isPrivateTask = (document.getElementById('isPrivate') as HTMLInputElement).checked;

        if (!taskName || !userRelated) {
            alert('Please insert valid task name and a valid user');
            return;
        }

        try {
            const response = await apiFetch('/api/add-task', {
                method: 'POST',
                body: JSON.stringify({
                    tName: taskName,
                    tDes: description,
                    tUserRelated: userRelated,
                    isPrivate: isPrivateTask 
                })
            });
            
            const res = await response.json();
            alert(res.message);
            
            if (res.isAdded) {
                navigate('/tasks');
            }
        } catch (error) {
            console.error("Failed to create task:", error);
            alert("An error occurred while creating the task. Please try again.");
        }
    };

    const goBack = () => navigate('/tasks');

    return (
        <div className="newtask-bg">
          <div className="newtask-card">
            <h2 style={{textAlign: 'center'}}>Add New Task</h2>
            <div className='flexboxContainerNewTask'>
              <button onClick={goBack} className='clickbtn'>Back</button>
              <input id='name' type="text" className='inputLabel' placeholder='Task name' />
              <textarea id='description' className='descriptionInputLabel' placeholder='Task description' />
              <SelectOptions users={users.map(u => ({ username: u.username }))} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <input type="checkbox" id="isPrivate" style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                <label htmlFor="isPrivate" style={{ fontSize: '1.2rem', cursor: 'pointer', color: '#168fdb', fontWeight: 'bold' }}>
                    Private Task
                </label>
              </div>

              <button onClick={createTask} className='clickbtn'>Create</button>
            </div>
          </div>
        </div>
    )
};

export default NewTask;