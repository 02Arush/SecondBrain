import React, { createContext, useEffect, useState, useContext } from 'react';
import { getSignedInUser } from '@/api/db_ops';
import { AuthContext } from './authContext';
import Task from "@/api/task"
import { getTask } from '@/api/taskStorage';


const TaskContext = createContext(null);

const TaskProvider = ({ taskID, children }) => {
  const { email } = useContext(AuthContext)
  const [task, setTask] = useState();

  useEffect(() => {

    (
      async () => {
        const res = await getTask(email, taskID);
        const data = res.data;
        if (res.data instanceof Task) {
          setTask(res.data);
        }
      }

    )();

  }, [email, taskID])





  return (
    <TaskContext.Provider value={task}>
      {children}
    </TaskContext.Provider>
  );
};

export { TaskContext, TaskProvider };
