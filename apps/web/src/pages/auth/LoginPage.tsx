import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch, ApiError } from '../../lib/api';
import { PRODUCT_NAME } from '@rsvp/shared';
import { HeartHandshake, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/weddings';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await apiFetch<{ user: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      login(res.user);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('demo@wedding.com');
    setPassword('DemoPassword123!');
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-maroon-700 items-center justify-center text-saffron-300 shadow-md mb-4">
          <HeartHandshake size={32} />
        </div>
        <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">
          {PRODUCT_NAME}
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Sign in to manage wedding RSVPs, guest lists & WhatsApp updates
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-stone-200/50 rounded-2xl border border-cream-200 sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="organizer@wedding.com"
                  className="block w-full pl-10 pr-3.5 py-2.5 border border-cream-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-maroon-700 focus:border-maroon-700 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 border border-cream-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-maroon-700 focus:border-maroon-700 sm:text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-maroon-700 hover:bg-maroon-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maroon-700 transition-colors disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="mt-6 pt-6 border-t border-cream-200">
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="w-full py-2.5 px-3 rounded-xl border border-saffron-300 bg-saffron-50/70 hover:bg-saffron-100 text-saffron-900 text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Sparkles size={14} className="text-saffron-600" />
              <span>Fill Demo Credentials (demo@wedding.com)</span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-stone-600">
              Don't have an organizer account?{' '}
              <Link to="/register" className="font-semibold text-maroon-700 hover:text-maroon-800">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
