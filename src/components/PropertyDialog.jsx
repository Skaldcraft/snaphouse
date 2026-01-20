
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Tag, Upload, Image as ImageIcon, ClipboardPaste, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { parseDocument, extractPropertyInfo } from '@/lib/documentParser';

const PropertyDialog = ({ open, onClose, property }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [featureInput, setFeatureInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showPasteInfo, setShowPasteInfo] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    property_type: 'house',
    operation_type: 'sale',
    bedrooms: '',
    bathrooms: '',
    area: '',
    status: 'available',
    image_url: '',
    features: []
  });

  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title || '',
        description: property.description || '',
        price: property.price || '',
        location: property.location || '',
        property_type: property.property_type || 'house',
        operation_type: property.operation_type || 'sale',
        bedrooms: property.bedrooms || '',
        bathrooms: property.bathrooms || '',
        area: property.area || '',
        status: property.status || 'available',
        image_url: property.image_url || '',
        features: property.features || []
      });
    } else {
      setFormData({
        title: '',
        description: '',
        price: '',
        location: '',
        property_type: 'house',
        operation_type: 'sale',
        bedrooms: '',
        bathrooms: '',
        area: '',
        status: 'available',
        image_url: '',
        features: []
      });
    }
    setShowPasteInfo(false);
    setPasteContent('');
  }, [property, open]);

  const handleAddFeature = (e) => {
    e.preventDefault();
    if (featureInput.trim() && !formData.features.includes(featureInput.trim())) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()]
      });
      setFeatureInput('');
    }
  };

  const removeFeature = (fToRemove) => {
     setFormData({
       ...formData,
       features: formData.features.filter(f => f !== fToRemove)
     });
  };

  const handleParseInfo = () => {
    if (!pasteContent.trim()) return;

    // Expected format: Type [tab] Location [tab] Beds [tab] Baths [tab] Area [tab] Price [tab] Operation
    const parts = pasteContent.trim().split(/\t/);
    if (parts.length >= 7) {
       const [typeRaw, location, beds, baths, area, priceRaw, opRaw] = parts;
       
       let property_type = 'house';
       const typeLower = typeRaw.toLowerCase().trim();
       if (typeLower.includes('piso') || typeLower.includes('apartamento')) property_type = 'apartment';
       else if (typeLower.includes('casa') || typeLower.includes('chalet')) property_type = 'house';
       else if (typeLower.includes('adosado')) property_type = 'townhouse';
       else if (typeLower.includes('terreno')) property_type = 'land';
       else if (typeLower.includes('condo')) property_type = 'condo';

       let operation_type = 'sale';
       const opLower = opRaw.toLowerCase().trim();
       if (opLower.includes('alquiler') || opLower.includes('rent')) operation_type = 'rent';

       // Parse price
       let priceStr = priceRaw.replace(/[^0-9,.-]/g, '');
       priceStr = priceStr.replace(/\./g, '').replace(',', '.');
       const price = parseFloat(priceStr);

       setFormData({
          ...formData,
          title: `${typeRaw} in ${location}`,
          property_type,
          location: location.trim(),
          bedrooms: parseInt(beds) || 0,
          bathrooms: parseInt(baths) || 0,
          area: parseFloat(area) || 0,
          price: isNaN(price) ? 0 : price,
          operation_type
       });

       setShowPasteInfo(false);
       setPasteContent('');
       toast({ title: t('dialogs.parsed_success') });
    } else {
       toast({ variant: "destructive", title: t('dialogs.parse_error') });
    }
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setParsing(true);
    try {
      const text = await parseDocument(file);
      const extracted = extractPropertyInfo(text);
      
      setFormData(prev => ({
        ...prev,
        title: extracted.title || prev.title,
        description: extracted.description || prev.description,
        price: extracted.price || prev.price,
        bedrooms: extracted.bedrooms || prev.bedrooms,
        bathrooms: extracted.bathrooms || prev.bathrooms,
        area: extracted.area || prev.area,
        location: extracted.location || prev.location,
        property_type: extracted.property_type || prev.property_type,
        operation_type: extracted.operation_type || prev.operation_type,
      }));
      
      toast({ title: t('dialogs.parsed_success') });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: t('common.error'), description: "Failed to parse document. Ensure format is supported." });
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
          setUploading(true);
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
              .from('property-images')
              .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
              .from('property-images')
              .getPublicUrl(filePath);

          setFormData({ ...formData, image_url: publicUrl });
          toast({ title: "Image uploaded successfully" });
      } catch (error) {
          toast({ variant: "destructive", title: "Error uploading image", description: error.message });
      } finally {
          setUploading(false);
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSubmit = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        price: parseFloat(formData.price),
        property_type: formData.property_type,
        operation_type: formData.operation_type,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        area: formData.area ? parseFloat(formData.area) : null,
        status: formData.status,
        features: formData.features,
        image_url: formData.image_url
      };

      if (property) {
        // Update
        const { error } = await supabase
            .from('properties')
            .update(dataToSubmit)
            .eq('id', property.id);
        
        if (error) throw error;
        toast({ title: t('properties.update_success') });
      } else {
        // Create
        const { error } = await supabase
            .from('properties')
            .insert([dataToSubmit]);
        
        if (error) throw error;
        toast({ title: t('properties.add_success') });
      }

      onClose();
    } catch (error) {
      toast({ variant: "destructive", title: t('common.error'), description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between z-10">
            <h2 className="text-2xl font-bold text-slate-900">
              {property ? t('properties.update_property') : t('properties.add_property')}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
             {/* Main Image Upload & Info Paste */}
             <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                   <div className="relative w-32 h-32 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center flex-shrink-0">
                      {formData.image_url ? (
                         <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                         <ImageIcon className="h-8 w-8 text-slate-300" />
                      )}
                      {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs">Uploading...</div>}
                   </div>
                   
                   <div className="flex-1 space-y-3">
                      <div>
                         <label className="block text-sm font-medium text-slate-700 mb-2">{t('properties.main_image')}</label>
                         <div className="flex gap-2">
                             <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                                disabled={uploading}
                             />
                             <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => document.getElementById('file-upload').click()}
                                disabled={uploading}
                             >
                                <Upload className="h-4 w-4 mr-2" /> {uploading ? '...' : t('properties.upload_image')}
                             </Button>
                             <input
                                type="url"
                                name="image_url"
                                value={formData.image_url}
                                onChange={handleChange}
                                placeholder="Paste image URL"
                                className="flex-1 px-3 py-1 border border-slate-300 rounded text-sm"
                             />
                         </div>
                      </div>

                      <div className="flex gap-2">
                          <Button 
                             type="button"
                             variant="outline" 
                             size="sm" 
                             className="flex-1 border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                             onClick={() => setShowPasteInfo(!showPasteInfo)}
                          >
                             <ClipboardPaste className="h-4 w-4 mr-2" /> {t('common.add_info')}
                          </Button>

                          <div className="flex-1">
                             <input 
                               type="file" 
                               ref={fileInputRef} 
                               className="hidden" 
                               accept=".txt,.pdf,.docx,.csv" 
                               onChange={handleDocumentUpload}
                             />
                             <Button 
                               type="button"
                               variant="outline" 
                               size="sm" 
                               className="w-full border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                               onClick={() => fileInputRef.current.click()}
                               disabled={parsing}
                             >
                               {parsing ? (
                                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" /> 
                               ) : (
                                  <UploadCloud className="h-4 w-4 mr-2" />
                               )}
                               {parsing ? t('common.parsing_doc') : t('common.upload_doc')}
                             </Button>
                          </div>
                      </div>
                   </div>
                </div>
                
                <p className="text-xs text-right text-slate-400">{t('common.doc_support')}</p>

                <AnimatePresence>
                   {showPasteInfo && (
                      <motion.div 
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: 'auto', opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         className="overflow-hidden"
                      >
                         <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <label className="text-xs font-medium text-slate-600 mb-1 block">{t('common.paste_info')}</label>
                            <textarea
                               className="w-full text-sm p-2 border rounded-md mb-2 h-20"
                               placeholder={t('properties.paste_property_placeholder')}
                               value={pasteContent}
                               onChange={(e) => setPasteContent(e.target.value)}
                            />
                            <div className="flex gap-2 justify-end">
                               <Button size="sm" type="button" variant="ghost" onClick={() => setPasteContent('')}>{t('common.clear')}</Button>
                               <Button size="sm" type="button" onClick={handleParseInfo}>{t('common.parse')}</Button>
                            </div>
                         </div>
                      </motion.div>
                   )}
                </AnimatePresence>
             </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('properties.title')}</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('properties.price')} *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('properties.location')} *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('properties.type')} *</label>
                <select
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white"
                  required
                >
                  <option value="house">{t('properties.house')}</option>
                  <option value="apartment">{t('properties.apartment')}</option>
                  <option value="condo">{t('properties.condo')}</option>
                  <option value="townhouse">{t('properties.townhouse')}</option>
                  <option value="land">{t('properties.land')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('properties.operation_type')} *</label>
                <select
                  name="operation_type"
                  value={formData.operation_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white"
                  required
                >
                  <option value="sale">{t('properties.sale')}</option>
                  <option value="rent">{t('properties.rent')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('properties.bedrooms')}</label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('properties.bathrooms')}</label>
                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('properties.area')}</label>
                <input
                  type="number"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('common.status')} *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white"
                  required
                >
                  <option value="available">{t('properties.available')}</option>
                  <option value="sold">{t('properties.sold')}</option>
                  <option value="pending">{t('properties.pending')}</option>
                </select>
              </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-slate-700 mb-2">{t('properties.features')}</label>
               <div className="flex gap-2 mb-2">
                  <input 
                     value={featureInput}
                     onChange={(e) => setFeatureInput(e.target.value)}
                     placeholder="Add feature (e.g. 'Pool', 'Garage')"
                     className="flex-1 px-4 py-2 border rounded-lg"
                     onKeyDown={(e) => e.key === 'Enter' && handleAddFeature(e)}
                  />
                  <button type="button" onClick={handleAddFeature} className="px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200">
                     <Plus className="h-5 w-5" />
                  </button>
               </div>
               <div className="flex flex-wrap gap-2">
                  {formData.features.map((f, i) => (
                     <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
                        <Tag className="h-3 w-3 mr-1" />{f}
                        <button type="button" onClick={() => removeFeature(f)} className="ml-2 hover:text-blue-900"><X className="h-3 w-3" /></button>
                     </span>
                  ))}
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('properties.description')}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">{t('common.cancel')}</Button>
              <Button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700">
                {loading ? t('common.loading') : property ? t('properties.update_property') : t('properties.add_property')}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PropertyDialog;
