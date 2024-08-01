
import pkg from './api/db_ops.js';
const { getTasksForUser } = pkg;
const tasks = await getTasksForUser("akarushkumar7@gmail.com")
alert(JSON.stringify(tasks))