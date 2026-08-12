import React from 'react'
import type { ITask } from '../redux/tasksSlice';
import {apiFetch} from '../utils/api';
import { useAppSelector } from '../redux/hooks';

interface TaskInfoProps {
  show: boolean;
  task: ITask;
  updateTasks: (taskId: number) => void;
  close: () => void;
}

const TaskInfo: React.FC<TaskInfoProps> = (props) => {
  const currentUser = useAppSelector((state) => state.user.username);
  if (!props.show) return null;

  const endTask = async () => {
    if (window.confirm("Are you sure you want to end this task?")) {
      await apiFetch('/api/end-task', {
        method: 'POST',
        body: JSON.stringify({ tID: props.task.id, username: currentUser })
      })
      .then(response => response.json())
      .then(res => {
        alert(res.message);
        props.updateTasks(props.task.id);
        closePopUp();
      });
    }
  };

  const closePopUp = async () => {
    props.close()
  }

  if (!props.show)  
  {
    return null;
  } 

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <button className="modal-close" onClick={props.close} title="Close">&times;</button>
        <h2 className="modal-title">{props.task.name}</h2>
        <div className="modal-section">
          <strong><u>Description</u>:</strong>
          <div>{props.task.description}</div>
        </div>
        <div className="modal-section">
          <strong>Assigned to:</strong> {props.task.userRelated}
        </div>
        <div className="modal-section">
          <strong>Team:</strong> {props.task.teamNumber}
        </div>
        <button className="modal-action" onClick={endTask}>End Task</button>
      </div>
    </div>
  );
}

export default TaskInfo
