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
const Businesses = lazy(() => import('./pages/guest/Businesses'));
const BusinessDetail = lazy(() => import('./pages/guest/BusinessDetail'));
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
const ManagePosts = lazy(() => import('./pages/admin/ManagePosts'));
const ManageComments = lazy(() => import('./pages/admin/ManageComments'));
const ManageReviews = lazy(() => import('./pages/admin/ManageReviews'));
const ForgotPassword = lazy(() => import('./pages/guest/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/guest/ResetPassword'));
const NewsList = lazy(() => import('./pages/News/NewsList'));
const NewsDetail = lazy(() => import('./pages/News/NewsDetail'));
const CreatePost = lazy(() => import('./pages/News/CreatePost'));
const RegisterBusiness = lazy(() => import('./pages/user/RegisterBusiness'));
const ManageBusinessRegistrations = lazy(() => import('./pages/admin/ManageBusinessRegistrations'));
const BusinessDashboard = lazy(() => import('./pages/business/BusinessDashboard'));
const MyBookings = lazy(() => import('./pages/user/MyBookings'));

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
            <Route path="profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
            <Route path="itineraries" element={<ProtectedRoute><Itineraries /></ProtectedRoute>} />
            <Route path="locations" element={<Locations />} />
            <Route path="locations/:id" element={<LocationDetail />} />
            <Route path="businesses" element={<Businesses />} />
            <Route path="businesses/:id" element={<BusinessDetail />} />
            <Route path="chatbot" element={<Chatbot />} />
            <Route path="news" element={<NewsList />} />
            <Route path="news/:id" element={<NewsDetail />} />
            <Route path="news/create" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
            <Route path="register-business" element={<ProtectedRoute><RegisterBusiness /></ProtectedRoute>} />
            <Route path="business" element={<ProtectedRoute requireBusiness><BusinessDashboard /></ProtectedRoute>} />
            <Route path="my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
            <Route path="costs" element={<CostEstimation />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><MainLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="locations" element={<ManageLocations />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="categories" element={<ManageCategories />} />
            <Route path="posts" element={<ManagePosts />} />
            <Route path="comments" element={<ManageComments />} />
            <Route path="reviews" element={<ManageReviews />} />
            <Route path="business" element={<ManageBusinessRegistrations />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
