
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Users, Menu, X, LogOut, Calendar as CalendarIcon, PieChart } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import NotificationBell from '@/components/NotificationBell';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Removed Dashboard from navigation items
  const navigation = [
    { name: t('nav.properties'), href: '/properties', icon: Building2 },
    { name: t('nav.contacts'), href: '/contacts', icon: Users },
    { name: t('nav.calendar'), href: '/calendar', icon: CalendarIcon },
    { name: t('nav.analytics'), href: '/analytics', icon: PieChart },
  ];

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/login');
      toast({
        title: t('auth.sign_out_success'),
        description: t('auth.come_back_soon'),
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 text-slate-900">
      <nav className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2 cursor-pointer">
                <Building2 className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  SnapHouse
                </span>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="relative"
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </motion.div>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <NotificationBell />
              <div className="h-6 w-px bg-slate-200"></div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-slate-600 hover:text-red-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('nav.sign_out')}
              </Button>
            </div>

            <div className="md:hidden flex items-center space-x-4">
              <NotificationBell />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-slate-600 hover:text-blue-600 transition-colors"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-slate-200"
            >
              <div className="px-4 py-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">{t('nav.sign_out')}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
