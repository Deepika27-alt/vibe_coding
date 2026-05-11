import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Inbox from './pages/Inbox';
import TaskDetail from './pages/TaskDetail';
import MyRequests from './pages/MyRequests';
import Catalogue from './pages/Catalogue';
import UsersList from './pages/admin/UsersList';
import WorkflowsList from './pages/admin/WorkflowsList';
import RolesList from './pages/admin/RolesList';
import RoleEdit from './pages/admin/RoleEdit';
import SystemSettings from './pages/admin/SystemSettings';
import Analytics from './pages/admin/Analytics';
import AuditLog from './pages/admin/AuditLog';
import WorkflowStudio from './pages/studio/WorkflowStudio';

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

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/workflows" element={<WorkflowsList />} />
            <Route path="/admin/users" element={<UsersList />} />
            <Route path="/admin/roles" element={<RolesList />} />
            <Route path="/admin/roles/:id" element={<RoleEdit />} />
            <Route path="/admin/settings" element={<SystemSettings />} />
            <Route path="/admin/analytics" element={<Analytics />} />
            <Route path="/admin/audit" element={<AuditLog />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/studio/:workflowId" element={<WorkflowStudio />} />
        </Route>

        <Route path="*" element={<Navigate to="/inbox" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
