import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const AppointmentDialog = ({ open, onClose, onSuccess, appointment }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    client_id: '',
    property_id: '',
    date: '',
    time: '',
    notes: '',
    status: 'scheduled'
  });

  useEffect(() => {
    if (open && user) {
      fetchOptions();
      if (appointment) {
         const dateObj = new Date(appointment.date);
         const dateStr = dateObj.toISOString().split('T')[0];
         // Simple time extraction
         const timeStr = dateObj.toTimeString().substring(0, 5);
         
         setFormData({
            title: appointment.title,
            client_id: appointment.contact_id || '',
            property_id: appointment.property_id || '',
            date: dateStr,
            time: timeStr,
            notes: appointment.notes || '',
            status: appointment.status
         });
      } else {
         setFormData({ title: '', client_id: '', property_id: '', date: '', time: '', notes: '', status: 'scheduled' });
      }
    }
  }, [open, appointment, user]);

  const fetchOptions = async () => {
    try {
        const { data: clientsData } = await supabase.from('contacts').select('id, name').eq('user_id', user.id);
        const { data: propertiesData } = await supabase.from('properties').select('id, title').eq('user_id', user.id);
        
        setClients(clientsData || []);
        setProperties(propertiesData || []);
    } catch (error) {
        console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      
      const payload = {
          user_id: user.id,
          contact_id: formData.client_id,
          property_id: formData.property_id || null,
          title: formData.title,
          date: dateTime.toISOString(),
          notes: formData.notes,
          status: formData.status
      };

      if (appointment) {
         // Update
         const { error } = await supabase
             .from('appointments')
             .update(payload)
             .eq('id', appointment.id);

         if (error) throw error;
         toast({ title: t('calendar.appointment_updated') });
      } else {
         // Insert
         const { error } = await supabase
             .from('appointments')
             .insert([payload]);

         if (error) throw error;
         toast({ title: t('calendar.appointment_scheduled') });
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              {appointment ? t('calendar.edit_appointment') : t('calendar.schedule_viewing')}
            </h2>
            <button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <input
                required
                type="text"
                className="w-full px-3 py-2 border rounded-lg"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., Property Viewing"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Client *</label>
              <select
                required
                className="w-full px-3 py-2 border rounded-lg bg-white"
                value={formData.client_id}
                onChange={e => setFormData({...formData, client_id: e.target.value})}
              >
                <option value="">{t('calendar.select_client')}</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Property (Optional)</label>
              <select
                className="w-full px-3 py-2 border rounded-lg bg-white"
                value={formData.property_id}
                onChange={e => setFormData({...formData, property_id: e.target.value})}
              >
                <option value="">{t('calendar.select_property')}</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.date')} *</label>
                <input
                  required
                  type="date"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.time')} *</label>
                <input
                  required
                  type="time"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.time}
                  onChange={e => setFormData({...formData, time: e.target.value})}
                />
              </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.status')}</label>
               <select
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
               >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
               </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.notes')}</label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
              {loading ? t('common.loading') : t('calendar.save_appointment')}
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AppointmentDialog;