
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Building2, Mail, Lock, Info, Check } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password);
      if (!error) {
        toast({
          title: t('auth.account_created_toast'),
          description: t('auth.verify_email_toast'),
        });
      }
    } else {
      const { error } = await signIn(email, password);
      if (!error) {
        // Success toast removed as requested
        navigate('/');
      }
    }

    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>{t('auth.login_title')} - Login</title>
        <meta name="description" content="Sign in to manage your real estate properties and clients." />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-slate-200">
            <div className="flex flex-col items-center mb-6">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-blue-600 to-blue-800 p-4 rounded-2xl mb-4"
              >
                <Building2 className="h-12 w-12 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                {t('auth.login_title')}
              </h1>
              <p className="text-slate-600 mt-2">
                {isSignUp ? t('auth.create_account') : t('auth.login_subtitle')}
              </p>
            </div>

            {/* Language Selection Buttons */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setLanguage('en')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  language === 'en'
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600 ring-offset-2'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                English {language === 'en' && <Check className="h-3 w-3" />}
              </button>
              <button
                onClick={() => setLanguage('es')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  language === 'es'
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600 ring-offset-2'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Español {language === 'es' && <Check className="h-3 w-3" />}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                    placeholder={t('auth.email_placeholder')}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                    placeholder={t('auth.password_placeholder')}
                    required
                  />
                </div>
              </div>

              {isSignUp && (
                <div className="bg-blue-50 p-3 rounded-lg flex gap-3 items-start text-sm text-blue-800">
                   <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                   <p>{t('auth.verify_email_info')}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-lg font-medium transition-all"
              >
                {loading ? t('common.loading') : isSignUp ? t('auth.sign_up') : t('auth.sign_in')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                {isSignUp ? t('auth.already_have_account') : t('auth.no_account')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Login;
