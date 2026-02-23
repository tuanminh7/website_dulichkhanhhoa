import { Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/guest/Home';
import Locations from './pages/guest/Locations';
import LocationDetail from './pages/guest/LocationDetail';
import Food from './pages/guest/Food';
import Stay from './pages/guest/Stay';
import Chatbot from './pages/guest/Chatbot';
import CostEstimation from './pages/guest/CostEstimation';
import Login from './pages/guest/Login';
import Profile from './pages/user/Profile';
import Itineraries from './pages/user/Itineraries';
import Dashboard from './pages/admin/Dashboard';
import ManageLocations from './pages/admin/ManageLocations';
import ManageUsers from './pages/admin/ManageUsers';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="profile" element={<Profile />} />
        <Route path="itineraries" element={<Itineraries />} />
        {/* Guest routes */}
        <Route path="locations" element={<Locations />} />
        <Route path="locations/:id" element={<LocationDetail />} />
        <Route path="food" element={<Food />} />
        <Route path="stay" element={<Stay />} />
        <Route path="chatbot" element={<Chatbot />} />
        <Route path="costs" element={<CostEstimation />} />
        <Route path="login" element={<Login />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="locations" element={<ManageLocations />} />
        <Route path="users" element={<ManageUsers />} />
      </Route>
    </Routes>
  );
}

export default App;
