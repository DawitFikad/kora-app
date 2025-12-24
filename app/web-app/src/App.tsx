import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import OrganizerLanding from './features/organizer-landing/OrganizerLanding';
import OrganizerDashboard from './features/organizer-dashboard/OrganizerDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<OrganizerLanding />} />
        <Route path="/dashboard/*" element={<OrganizerDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
