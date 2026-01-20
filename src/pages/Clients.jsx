import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Mail, Phone, Edit, ArrowUpDown, Trash2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import ClientDialog from '@/components/ClientDialog';
import ClientDetailsDialog from '@/components/ClientDetailsDialog';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Contacts = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  // Confirmation Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [labelFilter, setLabelFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  useEffect(() => {
    let result = [...contacts];
    
    if (searchTerm) {
       result = result.filter(c => 
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          c.email?.toLowerCase().includes(searchTerm.toLowerCase())
       );
    }

    if (labelFilter !== 'all') {
       result = result.filter(c => c.client_type === labelFilter);
    }

    result.sort((a, b) => {
       const dateA = new Date(a.created_at);
       const dateB = new Date(b.created_at);
       return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredContacts(result);
  }, [searchTerm, labelFilter, sortOrder, contacts]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      toast({ variant: "destructive", title: "Error fetching contacts", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (e, id) => {
      e.stopPropagation();
      setContactToDelete(id);
      setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
      if (!contactToDelete) return;

      try {
          const { error } = await supabase.from('contacts').delete().eq('id', contactToDelete);
          if (error) throw error;
          
          setContacts(contacts.filter(c => c.id !== contactToDelete));
          toast({ title: t('clients.client_deleted') });
      } catch (error) {
          toast({ variant: "destructive", title: "Error deleting contact", description: error.message });
      } finally {
          setDeleteConfirmOpen(false);
          setContactToDelete(null);
      }
  };

  const handleEditClick = (e, contact) => {
    e.stopPropagation();
    setSelectedContact(contact);
    setDialogOpen(true);
  };

  const handleContactClick = (contact) => {
    setSelectedContact(contact);
    setDetailsOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>{t('clients.title')} - SnapHouse</title>
      </Helmet>
      <Layout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{t('clients.title')}</h1>
              <p className="text-slate-600 mt-1">{t('clients.subtitle')}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => { setSelectedContact(null); setDialogOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-5 w-5 mr-2" /> {t('clients.add_contact')}
              </Button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                   type="text" 
                   placeholder={t('clients.search_placeholder')} 
                   className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none text-slate-900"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
             
             <div className="flex gap-4 w-full sm:w-auto">
               <div className="w-1/2 sm:w-40">
                  <select 
                     className="w-full p-2 border rounded-lg h-full text-slate-900 bg-white"
                     value={labelFilter}
                     onChange={e => setLabelFilter(e.target.value)}
                  >
                     <option value="all">{t('clients.all_types')}</option>
                     <option value="buyer">{t('clients.buyer')}</option>
                     <option value="seller">{t('clients.seller')}</option>
                     <option value="tenant">{t('clients.tenant')}</option>
                     <option value="landlord">{t('clients.landlord')}</option>
                  </select>
               </div>
               
               <div className="w-1/2 sm:w-40 relative">
                  <ArrowUpDown className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <select 
                     className="w-full pl-8 p-2 border rounded-lg h-full text-slate-900 bg-white"
                     value={sortOrder}
                     onChange={e => setSortOrder(e.target.value)}
                  >
                     <option value="newest">{t('clients.newest')}</option>
                     <option value="oldest">{t('clients.oldest')}</option>
                  </select>
               </div>
             </div>
          </div>

          {loading ? (
             <div className="flex justify-center h-64 items-center">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
             </div>
          ) : contacts.length === 0 ? (
             <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500">{t('common.no_results')}</p>
                <div className="flex gap-4 justify-center mt-2">
                   <Button variant="link" onClick={() => setDialogOpen(true)}>{t('clients.add_contact')}</Button>
                </div>
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <AnimatePresence>
                 {filteredContacts.map((contact) => (
                   <motion.div
                     key={contact.id}
                     layout
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     onClick={() => handleContactClick(contact)}
                     className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-all cursor-pointer group relative"
                   >
                      <div className="absolute top-4 right-4 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={(e) => handleEditClick(e, contact)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                         >
                            <Edit className="h-4 w-4" />
                         </button>
                         <button 
                            onClick={(e) => handleDeleteClick(e, contact.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                         >
                            <Trash2 className="h-4 w-4" />
                         </button>
                      </div>

                     <div className="flex justify-between items-start mb-4 pr-16">
                        <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br ${
                               contact.client_type === 'buyer' ? 'from-blue-400 to-blue-600' :
                               contact.client_type === 'seller' ? 'from-orange-400 to-orange-600' :
                               'from-slate-400 to-slate-600'
                           }`}>
                              {contact.name.charAt(0).toUpperCase()}
                           </div>
                           <div>
                              <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{contact.name}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                                   contact.client_type === 'buyer' ? 'bg-blue-100 text-blue-700' :
                                   contact.client_type === 'seller' ? 'bg-orange-100 text-orange-700' :
                                   'bg-slate-100 text-slate-700'
                              }`}>
                                 {t(`clients.${contact.client_type}`) || contact.client_type}
                              </span>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-slate-600">
                           <Mail className="h-4 w-4 mr-2" /> {contact.email}
                        </div>
                        {contact.phone && (
                           <div className="flex items-center text-sm text-slate-600">
                              <Phone className="h-4 w-4 mr-2" /> {contact.phone}
                           </div>
                        )}
                     </div>

                     <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                        <span>Added {new Date(contact.created_at).toLocaleDateString()}</span>
                        <span className="group-hover:translate-x-1 transition-transform">View Profile →</span>
                     </div>
                   </motion.div>
                 ))}
               </AnimatePresence>
             </div>
          )}
        </div>

        <ClientDialog 
           open={dialogOpen} 
           onClose={() => { setDialogOpen(false); fetchContacts(); }} 
           client={selectedContact} 
        />
        <ClientDetailsDialog 
           open={detailsOpen}
           onClose={() => { setDetailsOpen(false); }}
           client={selectedContact}
           onUpdate={fetchContacts}
        />

        <ConfirmationDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title={t('common.confirm_delete')}
          description="Are you sure you want to delete this contact? This action cannot be undone."
          onConfirm={confirmDelete}
          confirmText="Delete"
          variant="destructive"
        />
      </Layout>
    </>
  );
};

export default Contacts;