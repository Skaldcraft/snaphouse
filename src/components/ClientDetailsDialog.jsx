import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, Clock, Target, Building2, MessageSquare, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';

const ClientDetailsDialog = ({ open, onClose, client, onUpdate }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [interactions, setInteractions] = useState([]);
  const [matchingProperties, setMatchingProperties] = useState([]);
  const [loadingInteractions, setLoadingInteractions] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Form states
  const [interactionForm, setInteractionForm] = useState({ type: 'call', notes: '' });
  const [requirements, setRequirements] = useState({
    minPrice: 0,
    maxPrice: 1000000,
    location: '',
    propertyType: 'any'
  });

  useEffect(() => {
    if (client && open) {
      fetchInteractions();
      if (client.requirements) {
        setRequirements({ ...requirements, ...client.requirements });
      }
    }
  }, [client, open]);

  useEffect(() => {
    if (activeTab === 'matches' && client) {
      fetchMatchingProperties();
    }
  }, [activeTab]);

  const fetchInteractions = () => {
    setLoadingInteractions(true);
    const allInteractions = JSON.parse(localStorage.getItem('snaphouse_interactions') || '[]');
    const clientInteractions = allInteractions
      .filter(i => i.client_id === client.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    setInteractions(clientInteractions);
    setLoadingInteractions(false);
  };

  const fetchMatchingProperties = () => {
    setLoadingMatches(true);
    const allProperties = JSON.parse(localStorage.getItem('snaphouse_properties') || '[]');
    
    // Simple mock filter
    const matched = allProperties.filter(p => {
        if (p.status !== 'available') return false;
        if (requirements.propertyType !== 'any' && p.property_type !== requirements.propertyType) return false;
        if (requirements.minPrice && p.price < requirements.minPrice) return false;
        if (requirements.maxPrice && p.price > requirements.maxPrice) return false;
        if (requirements.location && !p.location.toLowerCase().includes(requirements.location.toLowerCase())) return false;
        return true;
    });

    setMatchingProperties(matched);
    setLoadingMatches(false);
  };

  const handleLogInteraction = async (e) => {
    e.preventDefault();
    try {
      const allInteractions = JSON.parse(localStorage.getItem('snaphouse_interactions') || '[]');
      const newInteraction = {
        id: Date.now().toString(),
        client_id: client.id,
        type: interactionForm.type,
        notes: interactionForm.notes,
        date: new Date().toISOString()
      };
      
      localStorage.setItem('snaphouse_interactions', JSON.stringify([...allInteractions, newInteraction]));
      toast({ title: "Interaction logged" });
      setInteractionForm({ type: 'call', notes: '' });
      fetchInteractions();
    } catch (error) {
      toast({ variant: "destructive", title: t('common.error'), description: error.message });
    }
  };

  const handleSaveRequirements = async () => {
    try {
      const allClients = JSON.parse(localStorage.getItem('snaphouse_clients') || '[]');
      const updatedClients = allClients.map(c => 
        c.id === client.id ? { ...c, requirements: requirements } : c
      );
      localStorage.setItem('snaphouse_clients', JSON.stringify(updatedClients));

      toast({ title: "Requirements updated", description: "Client preferences saved." });
      if (onUpdate) onUpdate();
    } catch (error) {
      toast({ variant: "destructive", title: t('common.error'), description: error.message });
    }
  };

  if (!open || !client) return null;

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
          <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{client.name}</h2>
              <div className="flex gap-2 mt-1">
                <span className="text-sm text-slate-500">{client.email}</span>
                <span className="text-sm text-slate-300">•</span>
                <span className="text-sm text-slate-500 capitalize">{client.client_type || 'Buyer'}</span>
              </div>
            </div>
            <button onClick={onClose}><X className="h-6 w-6 text-slate-400 hover:text-slate-600" /></button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 px-6">
            {['profile', 'interactions', 'requirements', 'matches'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {t(`clients.${tab}`) || tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 bg-white">
            
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <h3 className="font-semibold mb-4 text-slate-900">{t('clients.contact_info')}</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-slate-600">
                        <Mail className="h-4 w-4" /> {client.email}
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <Phone className="h-4 w-4" /> {client.phone || 'No phone'}
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <Clock className="h-4 w-4" /> Added: {new Date(client.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <h3 className="font-semibold mb-4 text-slate-900">{t('clients.status_tags')}</h3>
                    <div className="mb-2">
                      <span className="text-xs text-slate-500 uppercase tracking-wider">{t('common.status')}</span>
                      <p className="font-medium capitalize text-slate-800">{client.status}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 uppercase tracking-wider">{t('clients.interests_tags')}</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {client.tags?.map(t => (
                          <span key={t} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">{t}</span>
                        )) || <span className="text-slate-400 text-sm">No tags</span>}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-slate-900">{t('common.notes')}</h3>
                  <p className="text-slate-600 p-4 bg-slate-50 rounded-xl border border-slate-100 italic">
                    {client.notes || "No notes available."}
                  </p>
                </div>
              </div>
            )}

            {/* INTERACTIONS TAB */}
            {activeTab === 'interactions' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* List */}
                <div className="lg:col-span-2 space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  <h3 className="font-semibold text-slate-900">{t('clients.history')}</h3>
                  {loadingInteractions ? <div className="text-slate-400">{t('common.loading')}</div> : interactions.length === 0 ? (
                    <div className="text-slate-400 text-sm">No interactions logged yet.</div>
                  ) : (
                    interactions.map(interaction => (
                      <div key={interaction.id} className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          interaction.type === 'call' ? 'bg-blue-100 text-blue-600' :
                          interaction.type === 'email' ? 'bg-purple-100 text-purple-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          {interaction.type === 'call' ? <Phone className="h-5 w-5" /> :
                           interaction.type === 'email' ? <Mail className="h-5 w-5" /> :
                           <MessageSquare className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 capitalize mb-1">
                            {interaction.type} • {new Date(interaction.date).toLocaleString()}
                          </p>
                          <p className="text-slate-600 text-sm">{interaction.notes}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Form */}
                <div className="bg-slate-50 p-4 rounded-xl h-fit">
                  <h3 className="font-semibold text-slate-900 mb-4">{t('clients.log_interaction')}</h3>
                  <form onSubmit={handleLogInteraction} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                      <select 
                        className="w-full p-2 border rounded-lg text-sm"
                        value={interactionForm.type}
                        onChange={e => setInteractionForm({...interactionForm, type: e.target.value})}
                      >
                        <option value="call">Phone call</option>
                        <option value="email">Email</option>
                        <option value="meeting">Meeting</option>
                        <option value="note">Note</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">{t('common.notes')}</label>
                      <textarea 
                        required
                        className="w-full p-2 border rounded-lg text-sm"
                        rows={4}
                        placeholder="What was discussed?"
                        value={interactionForm.notes}
                        onChange={e => setInteractionForm({...interactionForm, notes: e.target.value})}
                      />
                    </div>
                    <Button type="submit" size="sm" className="w-full">{t('clients.save_log')}</Button>
                  </form>
                </div>
              </div>
            )}

            {/* REQUIREMENTS TAB */}
            {activeTab === 'requirements' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3">
                  <Target className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-blue-900">{t('clients.search_profile')}</h4>
                    <p className="text-sm text-blue-700">{t('clients.search_profile_desc')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('properties.min_price')}</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border rounded-lg"
                      value={requirements.minPrice}
                      onChange={e => setRequirements({...requirements, minPrice: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('properties.max_price')}</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border rounded-lg"
                      value={requirements.maxPrice}
                      onChange={e => setRequirements({...requirements, maxPrice: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('clients.preferred_location')}</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border rounded-lg"
                      placeholder="e.g. Downtown"
                      value={requirements.location}
                      onChange={e => setRequirements({...requirements, location: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('properties.type')}</label>
                    <select 
                      className="w-full p-2 border rounded-lg"
                      value={requirements.propertyType}
                      onChange={e => setRequirements({...requirements, propertyType: e.target.value})}
                    >
                      <option value="any">Any</option>
                      <option value="house">House</option>
                      <option value="apartment">Apartment</option>
                      <option value="condo">Condo</option>
                      <option value="land">Land</option>
                    </select>
                  </div>
                </div>

                <Button onClick={handleSaveRequirements} className="w-full">
                  <Save className="h-4 w-4 mr-2" /> {t('clients.save_requirements')}
                </Button>
              </div>
            )}

            {/* MATCHES TAB */}
            {activeTab === 'matches' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-slate-900">{t('clients.matches')}</h3>
                  <Button variant="outline" size="sm" onClick={fetchMatchingProperties}>
                    {t('clients.refresh_matches')}
                  </Button>
                </div>

                {loadingMatches ? (
                  <div className="text-center py-10 text-slate-500">{t('common.loading')}</div>
                ) : matchingProperties.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl">
                    <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">{t('clients.no_matches')}</p>
                    <Button variant="link" onClick={() => setActiveTab('requirements')}>{t('clients.save_requirements')}</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {matchingProperties.map(prop => (
                      <div key={prop.id} className="flex gap-4 p-4 border rounded-xl hover:shadow-md transition-shadow">
                        <div className="w-20 h-20 bg-slate-200 rounded-lg flex-shrink-0 overflow-hidden">
                           {prop.image_url ? (
                             <img src={prop.image_url} alt="" className="w-full h-full object-cover" />
                           ) : (
                             <Building2 className="w-full h-full p-4 text-slate-400" />
                           )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 truncate">{prop.title}</h4>
                          <p className="text-sm text-slate-500 truncate">{prop.location}</p>
                          <p className="text-sm font-semibold text-blue-600 mt-1">${prop.price.toLocaleString()}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">95% Match</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ClientDetailsDialog;