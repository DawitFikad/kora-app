import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import OrganizerLanding from './features/organizer-landing/OrganizerLanding';
import OrganizerDashboard from './features/organizer-dashboard/OrganizerDashboard';
import AdminDashboard from './features/admin-dashboard/AdminDashboard';
import BookingPage from './features/booking/BookingPage';
import PaymentPage from './features/booking/PaymentPage';
import PaymentCallbackPage from './features/booking/PaymentCallbackPage';
import MyTicketsPage from './features/tickets/MyTicketsPage';

import { AuthProvider } from './core/context/AuthContext';
import { ToastProvider } from './core/components/Toast';

import { ProtectedRoute } from './core/components/ProtectedRoute';

import { ThemeProvider } from './core/context/ThemeContext';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <Router>
            <Routes>
              <Route path="/" element={<OrganizerLanding />} />

              {/* Public Booking Route */}
              <Route path="/book/:eventId" element={<BookingPage />} />

              {/* Payment Routes */}
              {/* Payment Page requires auth for fetching purchase details securely */}
              <Route element={<ProtectedRoute allowedRoles={['USER', 'ORGANIZER', 'ADMIN']} />}>
                <Route path="/payment/:purchaseId" element={<PaymentPage />} />
                <Route path="/my-tickets" element={<MyTicketsPage />} />
              </Route>

              {/* Callback is effectively public to ensure redirects work, but validation is secure */}
              <Route path="/payment/callback" element={<PaymentCallbackPage />} />

              {/* Organizer Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ORGANIZER']} />}>
                <Route path="/dashboard/*" element={<OrganizerDashboard />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin/*" element={<AdminDashboard />} />
              </Route>

              {/* Catch All - Redirect to Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
