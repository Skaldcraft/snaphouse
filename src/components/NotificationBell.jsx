import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const NotificationBell = () => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load notifications from local storage
    const stored = JSON.parse(localStorage.getItem('snaphouse_notifications') || '[]');
    setNotifications(stored);
    setUnreadCount(stored.filter(n => !n.is_read).length);
    
    // Listen for storage events (optional, for simple reactivity)
    const handleStorage = () => {
        const updated = JSON.parse(localStorage.getItem('snaphouse_notifications') || '[]');
        setNotifications(updated);
        setUnreadCount(updated.filter(n => !n.is_read).length);
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const markAsRead = () => {
    if (unreadCount > 0) {
      const updated = notifications.map(n => ({ ...n, is_read: true }));
      setNotifications(updated);
      setUnreadCount(0);
      localStorage.setItem('snaphouse_notifications', JSON.stringify(updated));
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) markAsRead();
        }}
        className="relative p-2 text-slate-600 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full ring-2 ring-white" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-slate-900">{t('nav.notifications')}</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                        !notification.is_read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <h4 className="text-sm font-medium text-slate-900">{notification.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">{notification.message}</p>
                      <span className="text-[10px] text-slate-400 mt-2 block">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    {t('nav.no_notifications')}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;