import React from 'react'
import TaskInfo from './TaskInfo'
import { useState } from 'react'
import PopUp from './PopUp'
import { type ITask } from '../redux/tasksSlice';

interface TaskPreviewProps {
  taskData: ITask;
  updateTasks: (taskId: number) => void;
}

const TaskPreview: React.FC<TaskPreviewProps> = ({ taskData, updateTasks }) => {
    const [showInfo, setShowInfo] = useState<boolean>(false);
  
    const popUpContent = {
        name: 'Task Completed', 
        content: <p>Task is already finished!</p>
    };
  
    const closeInfoFunc = () => {
        setShowInfo(false);
    };
  
    return (
      <div>
        <div onClick={() => setShowInfo(true)} className='taskPreview'>
          <div className='taskName'>
            {taskData.name}
          </div>
          <div className='taskUserRelated'>
            {taskData.userRelated}
          </div>
        </div>
        
        { (showInfo && taskData.isDone) ? (
            <PopUp close={closeInfoFunc} isTimed={true} info={popUpContent} />
        ) : showInfo ? (
            <TaskInfo 
                task={taskData} 
                show={showInfo} 
                updateTasks={updateTasks} 
                close={closeInfoFunc} 
            />
        ) : null}
      </div>
    );
};

export default TaskPreview;