import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';

const EmailPropertyDialog = ({ open, onClose, property }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      const storedContacts = JSON.parse(localStorage.getItem('snaphouse_clients') || '[]');
      setContacts(storedContacts);
      setMessage(`Hi,\n\nI thought you might be interested in this property: ${property?.title}.\n\nIt's located at ${property?.location} and listed for $${property?.price?.toLocaleString()}.\n\nLet me know if you want to schedule a viewing!\n\nBest regards,`);
    }
  }, [open, property]);

  const handleSend = async () => {
    if (!selectedContact) {
      toast({ variant: "destructive", title: t('dialogs.select_contact') });
      return;
    }

    setLoading(true);
    // Mock sending process
    setTimeout(() => {
        try {
            // Log interaction
            const allInteractions = JSON.parse(localStorage.getItem('snaphouse_interactions') || '[]');
            localStorage.setItem('snaphouse_interactions', JSON.stringify([...allInteractions, {
                id: Date.now().toString(),
                client_id: selectedContact,
                type: 'email',
                notes: `Sent property details via email for: ${property.title}`,
                date: new Date().toISOString()
            }]));
            
            toast({ title: t('dialogs.email_sent'), description: "This is a demo. No actual email was sent." });
            onClose();
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: t('dialogs.email_error') });
        } finally {
            setLoading(false);
        }
    }, 1000);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
        >
          <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="text-lg font-bold text-slate-900">{t('dialogs.share_property')}</h3>
            <button onClick={onClose}><X className="h-5 w-5 text-slate-400 hover:text-slate-600" /></button>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-xs flex gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>Demo Mode: Emails are simulated and interactions are logged locally.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('dialogs.select_contact')}</label>
              <select 
                className="w-full p-2 border rounded-lg bg-white text-slate-900"
                value={selectedContact}
                onChange={e => setSelectedContact(e.target.value)}
              >
                <option value="">{t('dialogs.choose_contact')}</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('dialogs.message')}</label>
              <textarea 
                rows={8}
                className="w-full p-3 border rounded-lg text-sm text-slate-900"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>

            <Button onClick={handleSend} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
              {loading ? t('dialogs.sending') : <><Send className="h-4 w-4 mr-2" /> {t('dialogs.send_email')}</>}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EmailPropertyDialog;