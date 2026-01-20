
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, MapPin, Bed, Bath, Maximize, Search, Filter } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import PropertyDialog from '@/components/PropertyDialog';
import PropertyDetailsDialog from '@/components/PropertyDetailsDialog';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Properties = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  // Confirmation Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);

  // Search State
  const [filters, setFilters] = useState({
    search: '',
    minPrice: '',
    maxPrice: '',
    type: 'all',
    feature: ''
  });

  useEffect(() => {
    if (user) {
        fetchProperties();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [filters, properties]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
         .from('properties')
         .select('*')
         .eq('user_id', user.id)
         .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
      setFilteredProperties(data || []);
    } catch (error) {
      toast({ variant: "destructive", title: t('common.error'), description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...properties];

    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(term) || 
        p.location.toLowerCase().includes(term)
      );
    }

    if (filters.type !== 'all') {
      result = result.filter(p => p.property_type === filters.type);
    }

    if (filters.minPrice) {
      result = result.filter(p => p.price >= Number(filters.minPrice));
    }

    if (filters.maxPrice) {
      result = result.filter(p => p.price <= Number(filters.maxPrice));
    }

    if (filters.feature) {
       result = result.filter(p => p.features && p.features.some(f => f.toLowerCase().includes(filters.feature.toLowerCase())));
    }

    setFilteredProperties(result);
  };

  const handleCardClick = (property) => {
    setSelectedProperty(property);
    setDetailsOpen(true);
  };

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    setPropertyToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!propertyToDelete) return;

    try {
      const { error } = await supabase.from('properties').delete().eq('id', propertyToDelete);
      if (error) throw error;
      
      setProperties(properties.filter(p => p.id !== propertyToDelete));
      toast({ title: t('properties.delete_success') });
    } catch (error) {
      toast({ variant: "destructive", title: t('common.error'), description: error.message });
    } finally {
      setDeleteConfirmOpen(false);
      setPropertyToDelete(null);
    }
  };

  const handleEdit = (e, property) => {
    e.stopPropagation();
    setSelectedProperty(property);
    setDialogOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>{t('properties.title')} - SnapHouse</title>
      </Helmet>
      <Layout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{t('properties.title')}</h1>
              <p className="text-slate-600 mt-1">{t('properties.subtitle')}</p>
            </div>
            <Button onClick={() => { setSelectedProperty(null); setDialogOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-5 w-5 mr-2" /> {t('properties.add_property')}
            </Button>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
             <div className="flex gap-4 items-center mb-4">
                <div className="relative flex-1">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                   <input 
                      type="text" 
                      placeholder={t('properties.search_placeholder')}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                      value={filters.search}
                      onChange={e => setFilters({...filters, search: e.target.value})}
                   />
                </div>
             </div>

             {/* Always visible filters */}
             <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">{t('properties.type')}</label>
                  <select 
                      className="w-full p-2 border rounded-lg text-sm bg-white text-slate-900"
                      value={filters.type}
                      onChange={e => setFilters({...filters, type: e.target.value})}
                  >
                      <option value="all">{t('properties.all_types')}</option>
                      <option value="house">{t('properties.house')}</option>
                      <option value="apartment">{t('properties.apartment')}</option>
                      <option value="condo">{t('properties.condo')}</option>
                      <option value="land">{t('properties.land')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">{t('properties.min_price')}</label>
                  <input 
                      type="number" 
                      className="w-full p-2 border rounded-lg text-sm"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={e => setFilters({...filters, minPrice: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">{t('properties.max_price')}</label>
                  <input 
                      type="number" 
                      className="w-full p-2 border rounded-lg text-sm"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={e => setFilters({...filters, maxPrice: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">{t('properties.features')}</label>
                  <input 
                      type="text" 
                      className="w-full p-2 border rounded-lg text-sm"
                      placeholder="e.g. Pool"
                      value={filters.feature}
                      onChange={e => setFilters({...filters, feature: e.target.value})}
                  />
                </div>
             </div>
          </div>

          {loading ? (
             <div className="flex justify-center h-64 items-center">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
             </div>
          ) : properties.length === 0 ? (
             <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500">{t('common.no_results')}</p>
                <Button variant="link" onClick={() => setDialogOpen(true)}>{t('properties.add_property')}</Button>
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <AnimatePresence>
                 {filteredProperties.map((property) => (
                   <motion.div
                     key={property.id}
                     layout
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.9 }}
                     onClick={() => handleCardClick(property)}
                     className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200 hover:shadow-xl transition-all cursor-pointer group"
                   >
                     <div className="relative h-48 bg-slate-200">
                       {property.image_url ? (
                         <img src={property.image_url} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                       )}
                       <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                         property.status === 'available' ? 'bg-green-500 text-white' : 
                         property.status === 'pending' ? 'bg-amber-500 text-white' :
                         'bg-slate-500 text-white'
                       }`}>
                         {t(`properties.${property.status}`) || property.status}
                       </span>
                     </div>

                     <div className="p-5">
                       <h3 className="text-lg font-bold text-slate-900 truncate mb-1">{property.title}</h3>
                       <p className="text-slate-500 text-sm flex items-center mb-3">
                          <MapPin className="h-3 w-3 mr-1" /> {property.location}
                       </p>
                       <p className="text-xl font-bold text-blue-600 mb-4">
                         ${property.price?.toLocaleString()}
                       </p>

                       <div className="flex justify-between items-center text-sm text-slate-500 border-t pt-4">
                          <div className="flex gap-3">
                             <span className="flex items-center"><Bed className="h-4 w-4 mr-1"/>{property.bedrooms || '-'}</span>
                             <span className="flex items-center"><Bath className="h-4 w-4 mr-1"/>{property.bathrooms || '-'}</span>
                             <span className="flex items-center"><Maximize className="h-4 w-4 mr-1"/>{property.area || '-'}</span>
                          </div>
                          
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => handleEdit(e, property)}>
                                <Edit className="h-4 w-4" />
                             </Button>
                             <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={(e) => handleDeleteClick(e, property.id)}>
                                <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
                       </div>
                     </div>
                   </motion.div>
                 ))}
               </AnimatePresence>
             </div>
          )}
        </div>

        <PropertyDialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); fetchProperties(); }}
          property={selectedProperty}
        />
        <PropertyDetailsDialog 
           open={detailsOpen}
           onClose={() => setDetailsOpen(false)}
           property={selectedProperty}
        />

        <ConfirmationDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title={t('common.confirm_delete')}
          description="Are you sure you want to delete this property? This action cannot be undone."
          onConfirm={confirmDelete}
          confirmText="Delete"
          variant="destructive"
        />
      </Layout>
    </>
  );
};

export default Properties;
