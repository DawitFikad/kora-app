import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import OrganizerLanding from './features/organizer-landing/OrganizerLanding';
import OrganizerDashboard from './features/organizer-dashboard/OrganizerDashboard';
import AdminDashboard from './features/admin-dashboard/AdminDashboard';
import { OnboardingPage } from './features/auth/OnboardingPage';
import BookingPage from './features/booking/BookingPage';
import EventDetailsPage from './features/booking/EventDetailsPage';
import PaymentPage from './features/booking/PaymentPage';
import PaymentCallbackPage from './features/booking/PaymentCallbackPage';
import MyTicketsPage from './features/tickets/MyTicketsPage';
import SupportPage from './features/public-pages/SupportPage';
import ContactPage from './features/public-pages/ContactPage';
import HelpCenterPage from './features/public-pages/HelpCenterPage';
import TermsPage from './features/public-pages/TermsPage';
import RefundPolicyPage from './features/public-pages/RefundPolicyPage';
import OrganizerAgreementPage from './features/public-pages/OrganizerAgreementPage';
import AdminContentPolicyPage from './features/public-pages/AdminContentPolicyPage';

import { AuthProvider } from './core/context/AuthContext';
import { ToastProvider } from './core/components/Toast';

import { ProtectedRoute } from './core/components/ProtectedRoute';

import { ThemeProvider } from './core/context/ThemeContext';
import { LanguageProvider } from './core/context/LanguageContext';
import { DialogProvider } from './core/context/DialogContext';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
            <DialogProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<OrganizerLanding />} />

                {/* Public Booking Route */}
                <Route path="/book/:eventId" element={<BookingPage />} />
                <Route path="/event/:eventId" element={<EventDetailsPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/help-center" element={<HelpCenterPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/refund-policy" element={<RefundPolicyPage />} />
                <Route path="/organizer-agreement" element={<OrganizerAgreementPage />} />
                <Route path="/admin-content" element={<AdminContentPolicyPage />} />

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

                <Route element={<ProtectedRoute allowedRoles={['ORGANIZER', 'USER']} />}>
                  <Route path="/onboarding" element={<OnboardingPage />} />
                </Route>

                {/* Admin Routes */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                  <Route path="/admin/*" element={<AdminDashboard />} />
                </Route>

                {/* Catch All - Redirect to Home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Router>
            </DialogProvider>
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
