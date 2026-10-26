import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch, ApiError } from '../../lib/api';
import { PRODUCT_NAME, PASSWORD_MIN_LENGTH } from '@rsvp/shared';
import { HeartHandshake, Lock, Mail, User, Building2, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors(undefined);
    setIsSubmitting(true);

    try {
      const res = await apiFetch<{ user: any }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          businessName: businessName || undefined,
        }),
      });
      login(res.user);
      navigate('/weddings', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.fieldErrors);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-maroon-700 items-center justify-center text-saffron-300 shadow-md mb-4">
          <HeartHandshake size={32} />
        </div>
        <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">
          Create Organizer Account
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Get started managing weddings & WhatsApp RSVPs with {PRODUCT_NAME}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-stone-200/50 rounded-2xl border border-cream-200 sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Your Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <User size={18} />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aditi Rao"
                  className="block w-full pl-10 pr-3.5 py-2.5 border border-cream-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-maroon-700 sm:text-sm"
                />
              </div>
              {fieldErrors?.name && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.name[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Business / Agency Name (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Building2 size={18} />
                </div>
                <input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Royal Wedding Planners"
                  className="block w-full pl-10 pr-3.5 py-2.5 border border-cream-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-maroon-700 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aditi@weddingplanners.in"
                  className="block w-full pl-10 pr-3.5 py-2.5 border border-cream-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-maroon-700 sm:text-sm"
                />
              </div>
              {fieldErrors?.email && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.email[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Password (min {PASSWORD_MIN_LENGTH} characters) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 border border-cream-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-maroon-700 sm:text-sm"
                />
              </div>
              {fieldErrors?.password && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.password[0]}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-maroon-700 hover:bg-maroon-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maroon-700 transition-colors disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Creating account...' : 'Create Account'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-6 text-center pt-4 border-t border-cream-200">
            <p className="text-xs text-stone-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-maroon-700 hover:text-maroon-800">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
