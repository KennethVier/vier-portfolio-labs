import 'bootstrap/dist/css/bootstrap.min.css';
import Todo from './components/todocom';
import Email from './components/Email';
import Register from './components/Register';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './app.scss';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/ToDoList" replace />} />
        <Route path="/tasks" element={<Todo />} />
        <Route path="/ToDoList" element={<Email />} />
        <Route path="/notificationregister" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
