import axios from 'axios';
import { v4 as uuid } from "uuid";

const API_ROOT = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const API_BASE_URL = `${API_ROOT}/todos`;

export const addTask = (task) => {
    const email = localStorage.getItem('userEmail');
    
    if (!email) {
        throw new Error('User email is missing!');
    }

    const idTask = task.idTask || uuid();

    const taskWithEmailAndTitle = { 
        ...task, 
        userEmail: email,
        title: task.title,
        email: email,
        idTask
    };

    return axios.post(API_BASE_URL, taskWithEmailAndTitle)
        .then(response => response.data)
        .catch(error => {
            console.error('Error adding task:', error);
            throw error;
        });
};

export const getTaskById = (idTask) => axios.get(API_BASE_URL + '/' + idTask);

export const registerUser = (email) => {
    return axios.post(`${API_BASE_URL}/register`, null, { params: { email } })
        .then(response => response.data)
        .catch(error => {
            console.error('Error registering user:', error);
            throw error;
        });
};
  
export const getTasksByUserEmail = (email) => {
    if (!email) {
        return Promise.reject(new Error('User email is missing!'));
    }

    return axios.get(`${API_BASE_URL}/tasks?email=${email}`)
      .then(response => response.data)
      .catch(error => {
        console.error('There was an error fetching tasks by user email:', error);
        throw error;
      });
  };

  export const updateTask = (id, updatedTask) => {
    return axios.put(`${API_BASE_URL}/${id}`, updatedTask)
        .then(response => {
            console.log('Task updated successfully:', response.data);
            return response.data;
        })
        .catch(error => {
            console.error('Error updating task:', error);
            throw error;
        });
};

export const deleteTask = (id) => {
    return axios.delete(`${API_BASE_URL}/${id}`)
        .then(response => {
            console.log('Task deleted successfully');
            return response.data;
        })
        .catch(error => {
            console.error('Error deleting task:', error);
            throw error;
        });
};

export const updateTasks = (tasks) => {
    return axios.put(`${API_BASE_URL}/tasks/batch-update`, tasks)
        .then(response => {
            console.log('Tasks updated successfully:', response.data);
            return response.data
        })
        .catch(error => {
            console.error('Error batch updating tasks:', error);
            throw error;
        })
}



