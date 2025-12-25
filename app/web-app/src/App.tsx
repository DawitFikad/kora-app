import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import OrganizerLanding from './features/organizer-landing/OrganizerLanding';
import OrganizerDashboard from './features/organizer-dashboard/OrganizerDashboard';
import AdminDashboard from './features/admin-dashboard/AdminDashboard';
import BookingPage from './features/booking/BookingPage';

import { AuthProvider } from './core/context/AuthContext';
import { ToastProvider } from './core/components/Toast';

import { ProtectedRoute } from './core/components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<OrganizerLanding />} />

            {/* Public Booking Route */}
            <Route path="/book/:eventId" element={<BookingPage />} />

            {/* Organizer Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ORGANIZER']} />}>
              <Route path="/dashboard/*" element={<OrganizerDashboard />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin/*" element={<AdminDashboard />} />
            </Route>
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

