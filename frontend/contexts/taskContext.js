import React, { createContext, useEffect, useState, useContext } from 'react';
import { getSignedInUser } from '@/api/db_ops';
import { AuthContext } from './authContext';
import Task from "@/api/models/task";
import { getTask } from '@/api/taskStorage';

const TaskContext = createContext(null);

const TaskProvider = ({ taskID, children }) => {
  const { email } = useContext(AuthContext);
  const [task, setTask] = useState(null);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await getTask(email, taskID);
        const potentialTask = res?.data;
        if (potentialTask instanceof Task) {
          setTask(potentialTask);
        } else {
          console.error("Data is not an instance of Task");
        }
      } catch (error) {
        console.error("Failed to fetch task:", error);
      }
    };

    fetchTask();
  }, [email, taskID]);

  return (
    <TaskContext.Provider value={task}>
      {children}
    </TaskContext.Provider>
  );
};

export { TaskContext, TaskProvider };
