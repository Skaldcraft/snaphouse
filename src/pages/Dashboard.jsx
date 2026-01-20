import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Users, 
  Calendar as CalendarIcon, 
  Search, 
  Clock, 
  AlertCircle, 
  CheckCircle2
} from 'lucide-react';
import Layout from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Dashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    upcomingAppointments: [],
    pendingProperties: [],
    newListings: []
  });

  useEffect(() => {
    if (user) {
        fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // 1. Upcoming Appointments
      const { data: upcoming } = await supabase
        .from('appointments')
        .select(`*, contacts(name)`)
        .eq('user_id', user.id)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(3);

      // 2. Pending Offers/Properties
      const { data: pendingProps } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .limit(5);

      // 3. New Available Listings
      const { data: newListings } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(3);

      setSummaryData({
        upcomingAppointments: upcoming || [],
        pendingProperties: pendingProps || [],
        newListings: newListings || []
      });

    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const QuickActionBtn = ({ to, icon: Icon, title, description, colorClass }) => (
    <Link to={to} className="block group">
      <div className="bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-6 transition-all shadow-sm hover:shadow-md h-full">
        <div className={`${colorClass} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="font-bold text-lg text-slate-900 mb-1">{title}</h3>
        <p className="text-slate-500 text-sm">{description}</p>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('dashboard.title')} - SnapHouse</title>
      </Helmet>
      <Layout>
        <div className="space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{t('dashboard.title')}</h1>
              <p className="text-slate-600 mt-2">{t('dashboard.subtitle')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <QuickActionBtn 
              to="/properties" 
              icon={Search} 
              title={t('dashboard.property_search')} 
              description={t('dashboard.property_search_desc')} 
              colorClass="bg-blue-500" 
            />
            <QuickActionBtn 
              to="/clients" 
              icon={Users} 
              title={t('dashboard.client_management')} 
              description={t('dashboard.client_management_desc')} 
              colorClass="bg-emerald-500" 
            />
            <QuickActionBtn 
              to="/calendar" 
              icon={CalendarIcon} 
              title={t('dashboard.appointment_calendar')} 
              description={t('dashboard.appointment_calendar_desc')} 
              colorClass="bg-purple-500" 
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              {t('dashboard.pending_summary')}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-slate-500" />
                    {t('dashboard.scheduled_appointments')}
                  </h3>
                  <Link to="/calendar" className="text-xs text-blue-600 font-medium hover:underline">{t('common.view_all')}</Link>
                </div>
                <div className="p-4 flex-1">
                  {summaryData.upcomingAppointments.length > 0 ? (
                    <div className="space-y-4">
                      {summaryData.upcomingAppointments.map(apt => (
                        <div key={apt.id} className="flex gap-3 items-start">
                          <div className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded text-center min-w-[3.5rem]">
                            {new Date(apt.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 line-clamp-1">{apt.title}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(apt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {apt.contacts?.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-6">
                      <CalendarIcon className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">{t('dashboard.no_appointments')}</p>
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.2 }}
                 className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    {t('dashboard.pending_offers')}
                  </h3>
                  <Link to="/properties" className="text-xs text-blue-600 font-medium hover:underline">{t('common.view_all')}</Link>
                </div>
                <div className="p-4 flex-1">
                  {summaryData.pendingProperties.length > 0 ? (
                    <div className="space-y-3">
                      {summaryData.pendingProperties.map(prop => (
                        <div key={prop.id} className="flex items-center justify-between group">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                            <span className="text-sm text-slate-700 truncate">{prop.title}</span>
                          </div>
                          <span className="text-xs font-mono font-medium text-slate-500">
                            ${(prop.price / 1000).toFixed(0)}k
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-6">
                      <Clock className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">{t('dashboard.no_pending_deals')}</p>
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.3 }}
                 className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-slate-500" />
                    {t('dashboard.new_properties')}
                  </h3>
                  <Link to="/properties" className="text-xs text-blue-600 font-medium hover:underline">{t('common.view_all')}</Link>
                </div>
                <div className="p-0 flex-1">
                  {summaryData.newListings.length > 0 ? (
                    <div>
                      {summaryData.newListings.map((prop, idx) => (
                        <div key={prop.id} className={`p-4 flex items-center gap-3 ${idx !== summaryData.newListings.length - 1 ? 'border-b border-slate-50' : ''}`}>
                           {prop.image_url ? (
                              <img src={prop.image_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                           ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-slate-300" />
                              </div>
                           )}
                           <div className="overflow-hidden">
                             <p className="text-sm font-medium text-slate-900 truncate">{prop.title}</p>
                             <p className="text-xs text-slate-500 truncate">{prop.location}</p>
                           </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-6">
                      <Building2 className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">{t('dashboard.no_new_listings')}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Dashboard;