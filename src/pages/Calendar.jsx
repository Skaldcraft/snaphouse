import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, MapPin, User, AlertCircle, Trash2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import AppointmentDialog from '@/components/AppointmentDialog';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const CalendarPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Confirmation Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);

  useEffect(() => {
    if (user) {
        fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    try {
        setLoading(true);
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                contacts ( name ),
                properties ( title )
            `)
            .eq('user_id', user.id)
            .order('date', { ascending: true });

        if (error) throw error;
        setAppointments(data || []);
    } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Error fetching appointments", description: error.message });
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteClick = (e, id) => {
      e.stopPropagation();
      setAppointmentToDelete(id);
      setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
      if (!appointmentToDelete) return;
      
      try {
          const { error } = await supabase.from('appointments').delete().eq('id', appointmentToDelete);
          if (error) throw error;
          setAppointments(appointments.filter(a => a.id !== appointmentToDelete));
          toast({ title: t('calendar.appointment_cancelled') }); 
      } catch (error) {
          toast({ variant: "destructive", title: t('common.error'), description: error.message });
      } finally {
          setDeleteConfirmOpen(false);
          setAppointmentToDelete(null);
      }
  };

  const handleEdit = (appointment) => {
    setSelectedAppointment(appointment);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setSelectedAppointment(null);
    fetchAppointments();
  };

  const isOverdue = (date, status) => {
    return new Date(date) < new Date() && status !== 'completed' && status !== 'cancelled';
  };

  return (
    <>
      <Helmet>
        <title>{t('calendar.title')} - SnapHouse</title>
      </Helmet>
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{t('calendar.title')}</h1>
              <p className="text-slate-600 mt-1">{t('calendar.subtitle')}</p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {t('calendar.schedule_viewing')}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {loading ? (
                <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
              ) : appointments.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-slate-200 shadow-sm">
                  <CalendarIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900">{t('dashboard.no_appointments')}</h3>
                  <p className="text-slate-500">{t('dashboard.appointment_calendar_desc')}</p>
                </div>
              ) : (
                appointments.map((apt, idx) => {
                   const overdue = isOverdue(apt.date, apt.status);
                   return (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => handleEdit(apt)}
                      className={`bg-white rounded-xl p-6 shadow-sm border cursor-pointer hover:shadow-md transition-all flex flex-col sm:flex-row gap-6 group relative ${
                        overdue ? 'border-red-200 bg-red-50/10' : 'border-slate-200'
                      }`}
                    >
                      <button 
                         onClick={(e) => handleDeleteClick(e, apt.id)}
                         className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                         <Trash2 className="h-4 w-4" />
                      </button>

                      <div className={`flex flex-col items-center justify-center rounded-lg p-4 min-w-[100px] ${
                         overdue ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        <span className="text-3xl font-bold">
                          {new Date(apt.date).getDate()}
                        </span>
                        <span className="text-sm font-medium uppercase">
                          {new Date(apt.date).toLocaleString('default', { month: 'short' })}
                        </span>
                        <span className="text-xs mt-1 text-slate-500">
                          {new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{apt.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                            apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                            apt.status === 'cancelled' ? 'bg-slate-100 text-slate-500' :
                            overdue ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {overdue && <AlertCircle className="h-3 w-3" />}
                            {overdue ? t('calendar.overdue') : apt.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-700">{apt.contacts?.name || 'Unknown Client'}</span>
                          </div>
                          {apt.properties && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-700">{apt.properties.title}</span>
                            </div>
                          )}
                        </div>
                        
                        {apt.notes && (
                          <p className="text-sm text-slate-600 italic bg-slate-50 p-2 rounded mt-2 border border-slate-100">
                            "{apt.notes}"
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 h-fit">
              <h3 className="font-bold text-slate-900 mb-4">{t('calendar.title')}</h3>
              <div className="grid grid-cols-7 gap-2 text-center text-sm mb-2">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                  <div key={d} className="font-medium text-slate-400">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2 text-center text-sm">
                {Array.from({length: 31}, (_, i) => (
                  <div 
                    key={i} 
                    className={`aspect-square flex items-center justify-center rounded-full hover:bg-slate-100 cursor-pointer text-slate-700 ${
                      i + 1 === new Date().getDate() ? 'bg-blue-600 text-white hover:bg-blue-700 font-bold' : ''
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <AppointmentDialog 
          open={dialogOpen} 
          onClose={handleClose} 
          appointment={selectedAppointment}
          onSuccess={fetchAppointments}
        />

        <ConfirmationDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Delete Appointment"
          description="Are you sure you want to delete this appointment? This action cannot be undone."
          onConfirm={confirmDelete}
          confirmText="Delete"
          variant="destructive"
        />
      </Layout>
    </>
  );
};

export default CalendarPage;