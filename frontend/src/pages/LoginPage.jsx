import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { checkDemoAccess, checkAndRecordDemoUsage } from '../store/usageStore';
import { AlertCircle, Crown } from 'lucide-react';
import kavachLogo from '/KavachIQ_logo2.png';

export default function LoginPage() {
  const navigate = useNavigate();
  const { token, user, login } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blockedUser, setBlockedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: ''
  });

  // If already logged in, check demo access
  useEffect(() => {
    if (token && user) {
      const { allowed } = checkDemoAccess(user);
      if (allowed) {
        navigate('/', { replace: true });
      } else {
        navigate('/upgrade', { replace: true });
      }
    }
  }, [token, user, navigate]);

  const logoutAndReset = () => {
    useAuthStore.getState().logout();
    setBlockedUser(null);
    setError('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await authAPI.login({
          email: formData.email,
          password: formData.password
        });

        const loggedInUser = res.data.user;
        login(res.data.token, loggedInUser);

        // Check if this user has already used the demo
        const { allowed, reason } = checkAndRecordDemoUsage(loggedInUser);

        if (allowed) {
          navigate('/', { replace: true });
        } else {
          setBlockedUser({ email: loggedInUser.email, reason });
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        const res = await authAPI.register({
          username: formData.username,
          email: formData.email,
          password: formData.password
        });
        setIsLogin(true);
        setFormData({ email: '', password: '', username: '', confirmPassword: '' });
        setError('');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <img src={kavachLogo} alt="KavachIQ" className="h-12 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white">KavachIQ</h1>
            <p className="text-gray-400 text-sm mt-2">Security Intelligence Platform</p>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
            {isLogin ? 'Login to Dashboard' : 'Create Account'}
          </h2>

          {/* Upgrade Required Banner */}
          {blockedUser && (
            <div className="mb-6 p-6 bg-gradient-to-r from-amber-900/60 to-orange-900/60 border border-amber-600/40 rounded-xl text-center">
              <Crown className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-amber-300 mb-2">Demo Session Used</h3>
              <p className="text-amber-200/80 text-sm mb-4">
                {blockedUser.reason || 'This account has already used the one-time demo. Please upgrade to continue using KavachIQ.'}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => navigate('/upgrade')}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition text-sm"
                >
                  View Upgrade Plans
                </button>
                <button
                  onClick={() => logoutAndReset()}
                  className="px-4 py-2 text-amber-300/70 hover:text-amber-200 text-sm underline transition"
                >
                  Use Different Account
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !blockedUser && (
            <div className="mb-4 p-4 bg-red-900 border border-red-700 rounded flex items-gap-2 text-red-200 text-sm">
              <AlertCircle size={18} className="mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  placeholder="Choose a username"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition disabled:opacity-50"
            >
              {loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-400 hover:text-blue-300 ml-2 font-semibold"
              >
                {isLogin ? 'Register' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
