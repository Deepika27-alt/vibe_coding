import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Inbox from './pages/Inbox';
import TaskDetail from './pages/TaskDetail';
import MyRequests from './pages/MyRequests';
import Catalogue from './pages/Catalogue';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/inbox" replace />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/requests" element={<MyRequests />} />
          <Route path="/catalogue" element={<Catalogue />} />
        </Route>

        <Route path="*" element={<Navigate to="/inbox" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
