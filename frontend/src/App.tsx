import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ScrollToTop from './components/layout/ScrollToTop';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoadingOverlay from './components/common/LoadingOverlay';
import { Toaster } from 'react-hot-toast';

const Home = lazy(() => import('./pages/guest/Home'));
const Locations = lazy(() => import('./pages/guest/Locations'));
const LocationDetail = lazy(() => import('./pages/guest/LocationDetail'));
const Food = lazy(() => import('./pages/guest/Food'));
const Stay = lazy(() => import('./pages/guest/Stay'));
const Chatbot = lazy(() => import('./pages/guest/Chatbot'));
const CostEstimation = lazy(() => import('./pages/guest/CostEstimation'));
const Login = lazy(() => import('./pages/guest/Login'));
const Register = lazy(() => import('./pages/guest/Register'));
const Profile = lazy(() => import('./pages/user/Profile'));
const Itineraries = lazy(() => import('./pages/user/Itineraries'));
const NotFound = lazy(() => import('./pages/guest/NotFound'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const ManageLocations = lazy(() => import('./pages/admin/ManageLocations'));
const ManageUsers = lazy(() => import('./pages/admin/ManageUsers'));
const ManageCategories = lazy(() => import('./pages/admin/ManageCategories'));
const NewsList = lazy(() => import('./pages/News/NewsList'));
const NewsDetail = lazy(() => import('./pages/News/NewsDetail'));
const CreatePost = lazy(() => import('./pages/News/CreatePost'));
const ForgotPassword = lazy(() => import('./pages/guest/ForgotPassword'));

const RouteFallback = () => (
  <div className="min-h-screen pt-24 flex items-center justify-center bg-gray-50 text-center">
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-lg shadow-blue-500/20"></div>
      <p className="mt-6 text-gray-500 font-bold uppercase tracking-widest text-xs">Đang tải trang...</p>
    </div>
  </div>
);

function App() {
  return (
    <>
      <ScrollToTop />
      <LoadingOverlay />
      <Toaster position="top-right" />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="itineraries" element={<ProtectedRoute><Itineraries /></ProtectedRoute>} />
            <Route path="locations" element={<Locations />} />
            <Route path="locations/:id" element={<LocationDetail />} />
            <Route path="food" element={<Food />} />
            <Route path="stay" element={<Stay />} />
            <Route path="chatbot" element={<Chatbot />} />
            <Route path="news" element={<NewsList />} />
            <Route path="news/:id" element={<NewsDetail />} />
            <Route path="news/create" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
            <Route path="costs" element={<CostEstimation />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><MainLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="locations" element={<ManageLocations />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="categories" element={<ManageCategories />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
