import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Bed, Bath, FileText, Clock, Map, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import AppointmentDialog from '@/components/AppointmentDialog';
import EmailPropertyDialog from '@/components/EmailPropertyDialog';

const PropertyDetailsDialog = ({ open, onClose, property }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [history, setHistory] = useState([]);
  const [visits, setVisits] = useState([]);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  // Documents state
  const [documents, setDocuments] = useState(property?.documents || []);
  const [newDocUrl, setNewDocUrl] = useState('');
  const [newDocName, setNewDocName] = useState('');

  useEffect(() => {
    if (open && property) {
      if (property.documents) setDocuments(property.documents);
      fetchHistory();
      fetchVisits();
    }
  }, [open, property]);

  const fetchHistory = () => {
    const allHistory = JSON.parse(localStorage.getItem('snaphouse_history') || '[]');
    setHistory(allHistory.filter(h => h.property_id === property.id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
  };

  const fetchVisits = () => {
    const allAppointments = JSON.parse(localStorage.getItem('snaphouse_appointments') || '[]');
    const clients = JSON.parse(localStorage.getItem('snaphouse_clients') || '[]');
    
    // Join clients manually
    const visitsWithClients = allAppointments
        .filter(a => a.property_id === property.id)
        .map(a => ({
            ...a,
            clients: clients.find(c => c.id === a.client_id) || { name: 'Unknown' }
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    setVisits(visitsWithClients);
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!newDocName || !newDocUrl) return;

    const newDocs = [...documents, { name: newDocName, url: newDocUrl, date: new Date().toISOString() }];
    
    try {
      const properties = JSON.parse(localStorage.getItem('snaphouse_properties') || '[]');
      const updatedProps = properties.map(p => 
        p.id === property.id ? { ...p, documents: newDocs } : p
      );
      localStorage.setItem('snaphouse_properties', JSON.stringify(updatedProps));
      
      const allHistory = JSON.parse(localStorage.getItem('snaphouse_history') || '[]');
      localStorage.setItem('snaphouse_history', JSON.stringify([...allHistory, {
          id: Date.now().toString(),
          property_id: property.id,
          action: 'document_added',
          notes: `Added document: ${newDocName}`,
          created_at: new Date().toISOString()
      }]));

      setDocuments(newDocs);
      setNewDocName('');
      setNewDocUrl('');
      toast({ title: "Document added" });
      fetchHistory();
    } catch (error) {
      toast({ variant: "destructive", title: t('common.error'), description: error.message });
    }
  };

  if (!open || !property) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="relative h-48 bg-slate-900">
             {property.image_url ? (
                <img src={property.image_url} alt={property.title} className="w-full h-full object-cover opacity-80" />
             ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
             )}
             <button 
                onClick={onClose} 
                className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
             >
               <X className="h-5 w-5" />
             </button>
             <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1">{property.title}</h2>
                  <div className="flex items-center text-slate-300 text-sm">
                     <MapPin className="h-4 w-4 mr-1" /> {property.location}
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setEmailDialogOpen(true)}
                  className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-0"
                >
                  <Share2 className="h-4 w-4 mr-2" /> {t('properties.share_email')}
                </Button>
             </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 px-6 bg-white overflow-x-auto">
            {['overview', 'documents', 'location', 'history', 'visits'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {t(`properties.${tab}`) || tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 bg-white">
             
             {/* OVERVIEW */}
             {activeTab === 'overview' && (
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="md:col-span-2 space-y-6">
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">{t('properties.description')}</h3>
                      <p className="text-slate-600 leading-relaxed">{property.description || 'No description provided.'}</p>
                    </div>
                    
                    <div>
                       <h3 className="font-semibold text-slate-900 mb-3">{t('properties.features_amenities')}</h3>
                       <div className="flex flex-wrap gap-2">
                          {property.features && property.features.length > 0 ? (
                             property.features.map(f => (
                               <span key={f} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">{f}</span>
                             ))
                          ) : (
                             <p className="text-slate-400 text-sm">No features listed.</p>
                          )}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-xl space-y-4">
                       <h3 className="font-semibold text-slate-900">{t('properties.property_details')}</h3>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <p className="text-xs text-slate-500">Price</p>
                             <p className="font-bold text-blue-600 text-lg">${property.price.toLocaleString()}</p>
                          </div>
                          <div>
                             <p className="text-xs text-slate-500">Status</p>
                             <span className="capitalize font-medium text-slate-900">{property.status}</span>
                          </div>
                          <div>
                             <p className="text-xs text-slate-500">Type</p>
                             <span className="capitalize font-medium text-slate-900">{property.property_type}</span>
                          </div>
                          <div>
                             <p className="text-xs text-slate-500">Area</p>
                             <span className="font-medium text-slate-900">{property.area} sqft</span>
                          </div>
                       </div>
                       <div className="pt-4 border-t border-slate-200 flex justify-between text-sm">
                          <div className="flex items-center gap-1"><Bed className="h-4 w-4 text-slate-400"/> {property.bedrooms} Beds</div>
                          <div className="flex items-center gap-1"><Bath className="h-4 w-4 text-slate-400"/> {property.bathrooms} Baths</div>
                       </div>
                    </div>
                    <Button onClick={() => setAppointmentDialogOpen(true)} className="w-full bg-blue-600 hover:bg-blue-700">
                       <Calendar className="h-4 w-4 mr-2" /> {t('properties.schedule_visit')}
                    </Button>
                 </div>
               </div>
             )}

             {/* LOCATION */}
             {activeTab === 'location' && (
               <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-xl flex items-start gap-4">
                     <div className="bg-blue-100 p-3 rounded-full">
                        <MapPin className="h-6 w-6 text-blue-600" />
                     </div>
                     <div>
                        <h3 className="font-semibold text-slate-900 text-lg">{t('properties.location')}</h3>
                        <p className="text-slate-600 mt-1 text-lg">{property.location}</p>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.location)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 font-medium mt-3 hover:underline"
                        >
                           <Map className="h-4 w-4" /> {t('properties.view_maps')}
                        </a>
                     </div>
                  </div>
                  <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 text-slate-400">
                     Map Preview Placeholder
                  </div>
               </div>
             )}

             {/* DOCUMENTS */}
             {activeTab === 'documents' && (
                <div className="space-y-6">
                   <div className="bg-slate-50 p-4 rounded-xl">
                      <h3 className="font-semibold mb-3 text-slate-900">{t('properties.add_document')}</h3>
                      <form onSubmit={handleAddDocument} className="flex gap-2">
                         <input 
                            placeholder="Document Name (e.g. Floor Plan)" 
                            className="flex-1 px-3 py-2 rounded border"
                            value={newDocName}
                            onChange={e => setNewDocName(e.target.value)}
                         />
                         <input 
                            placeholder="URL" 
                            className="flex-1 px-3 py-2 rounded border"
                            value={newDocUrl}
                            onChange={e => setNewDocUrl(e.target.value)}
                         />
                         <Button type="submit">{t('common.add')}</Button>
                      </form>
                   </div>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {documents.length > 0 ? (
                         documents.map((doc, idx) => (
                           <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center p-4 border rounded-xl hover:bg-slate-50 transition-colors group">
                              <div className="bg-red-100 p-3 rounded-lg mr-4">
                                 <FileText className="h-6 w-6 text-red-500" />
                              </div>
                              <div>
                                 <h4 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{doc.name}</h4>
                                 <p className="text-xs text-slate-500">{new Date(doc.date).toLocaleDateString()}</p>
                              </div>
                           </a>
                         ))
                      ) : (
                         <div className="col-span-2 text-center py-10 text-slate-400">No documents attached.</div>
                      )}
                   </div>
                </div>
             )}

             {/* HISTORY */}
             {activeTab === 'history' && (
                <div className="space-y-4">
                   <h3 className="font-semibold text-slate-900">{t('properties.management_log')}</h3>
                   {history.length === 0 ? (
                      <div className="text-slate-400 text-sm">{t('common.no_results')}</div>
                   ) : (
                      <div className="relative border-l-2 border-slate-100 ml-3 space-y-6 pb-2">
                         {history.map(item => (
                            <div key={item.id} className="relative pl-6">
                               <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-100 border-2 border-white ring-1 ring-blue-500" />
                               <p className="text-sm font-bold text-slate-900 capitalize">{item.action.replace('_', ' ')}</p>
                               <p className="text-xs text-slate-500 mb-1">{new Date(item.created_at).toLocaleString()}</p>
                               <p className="text-sm text-slate-600">{item.notes}</p>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             )}

             {/* VISITS */}
             {activeTab === 'visits' && (
                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-slate-900">{t('properties.visit_records')}</h3>
                      <Button size="sm" variant="outline" onClick={() => setAppointmentDialogOpen(true)}>{t('properties.new_visit')}</Button>
                   </div>
                   
                   {visits.length === 0 ? (
                      <div className="text-center py-10 text-slate-400">No visits scheduled.</div>
                   ) : (
                      <div className="space-y-3">
                         {visits.map(visit => (
                            <div key={visit.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                               <div className="flex items-center gap-4">
                                  <div className="bg-white p-2 rounded-lg shadow-sm font-bold text-center min-w-[3rem]">
                                     <div className="text-xs text-slate-500 uppercase">{new Date(visit.date).toLocaleString('default', {month:'short'})}</div>
                                     <div className="text-lg text-slate-900">{new Date(visit.date).getDate()}</div>
                                  </div>
                                  <div>
                                     <p className="font-bold text-slate-900">{visit.title}</p>
                                     <div className="flex items-center text-sm text-slate-500 gap-3">
                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(visit.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                        <span>with <span className="text-blue-600 font-medium">{visit.clients?.name || 'Unknown'}</span></span>
                                     </div>
                                  </div>
                               </div>
                               <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                                  visit.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                               }`}>
                                  {visit.status}
                               </span>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             )}
          </div>
        </motion.div>

        <AppointmentDialog 
          open={appointmentDialogOpen} 
          onClose={() => setAppointmentDialogOpen(false)} 
          onSuccess={() => {
             fetchVisits();
             // Manually log history
             const allHistory = JSON.parse(localStorage.getItem('snaphouse_history') || '[]');
             localStorage.setItem('snaphouse_history', JSON.stringify([...allHistory, {
                 id: Date.now().toString(),
                 property_id: property.id,
                 action: 'visit_scheduled',
                 notes: 'Visit scheduled via details view',
                 created_at: new Date().toISOString()
             }]));
          }}
        />

        <EmailPropertyDialog
          open={emailDialogOpen}
          onClose={() => setEmailDialogOpen(false)}
          property={property}
        />
      </div>
    </AnimatePresence>
  );
};

export default PropertyDetailsDialog;