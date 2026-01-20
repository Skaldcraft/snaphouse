
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Tag, ClipboardPaste, UploadCloud, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { parseDocument, extractClientInfo } from '@/lib/documentParser';

const ClientDialog = ({ open, onClose, client }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showPasteInfo, setShowPasteInfo] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    budget: '',
    company: '',
    status: 'active',
    client_type: 'buyer',
    notes: '',
    tags: []
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        budget: client.target_budget || '',
        company: client.company || '',
        status: client.status || 'active',
        client_type: client.client_type || 'buyer',
        notes: client.notes || '',
        tags: client.tags || []
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        budget: '',
        company: '',
        status: 'active',
        client_type: 'buyer',
        notes: '',
        tags: []
      });
    }
    setShowPasteInfo(false);
    setPasteContent('');
  }, [client, open]);

  const handleAddTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tagToRemove)
    });
  };

  const handleParseInfo = () => {
    if (!pasteContent.trim()) return;

    // Expected format: Name [tab] Phone [tab] Email
    const parts = pasteContent.trim().split(/\t/);
    if (parts.length >= 3) {
       const [name, phone, email] = parts;
       setFormData({
          ...formData,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim()
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
      const extracted = extractClientInfo(text);
      
      setFormData(prev => ({
        ...prev,
        name: extracted.name || prev.name,
        email: extracted.email || prev.email,
        phone: extracted.phone || prev.phone,
        notes: (prev.notes + '\n\nExtracted content:\n' + extracted.notes).trim()
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const dataToSubmit = {
        user_id: user.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        target_budget: formData.budget ? parseFloat(formData.budget) : null,
        status: formData.status,
        client_type: formData.client_type,
        notes: formData.notes,
        tags: formData.tags
      };

      if (client) {
        // Update
        const { error } = await supabase
          .from('contacts')
          .update(dataToSubmit)
          .eq('id', client.id);
        
        if (error) throw error;
        toast({ title: t('clients.client_updated') });
      } else {
        // Create
        const { error } = await supabase
          .from('contacts')
          .insert([dataToSubmit]);
        
        if (error) throw error;
        toast({ title: t('clients.client_added') });
      }
      onClose();
    } catch (error) {
      toast({ variant: "destructive", title: t('common.error'), description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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
            <h2 className="text-2xl font-bold text-slate-900">{client ? t('common.edit') : t('clients.add_contact')}</h2>
            <button onClick={onClose}><X className="h-6 w-6 text-slate-400 hover:text-slate-600" /></button>
          </div>

          <div className="p-6 pb-0 space-y-3">
             <div className="flex gap-2">
                 <Button 
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
             
             <p className="text-xs text-center text-slate-400">{t('common.doc_support')}</p>

             <AnimatePresence>
                {showPasteInfo && (
                   <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-3"
                   >
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                         <label className="text-xs font-medium text-slate-600 mb-1 block">{t('common.paste_info')}</label>
                         <textarea
                            className="w-full text-sm p-2 border rounded-md mb-2 h-20"
                            placeholder={t('clients.paste_client_placeholder')}
                            value={pasteContent}
                            onChange={(e) => setPasteContent(e.target.value)}
                         />
                         <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => setPasteContent('')}>{t('common.clear')}</Button>
                            <Button size="sm" onClick={handleParseInfo}>{t('common.parse')}</Button>
                         </div>
                      </div>
                   </motion.div>
                )}
             </AnimatePresence>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('clients.name')} *</label>
                <input required name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('auth.email')} *</label>
                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('clients.phone')}</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('clients.label')}</label>
                <select name="client_type" value={formData.client_type} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-white">
                  <option value="buyer">{t('clients.buyer')}</option>
                  <option value="tenant">{t('clients.tenant')}</option>
                  <option value="seller">{t('clients.seller')}</option>
                  <option value="landlord">{t('clients.landlord')}</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('clients.interests_tags')}</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add interest tag (e.g. 'Pool')"
                    className="flex-1 px-4 py-2 border rounded-lg"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag(e)}
                  />
                  <button type="button" onClick={handleAddTag} className="px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200">
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="ml-2 hover:text-blue-900"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('common.status')}</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
                  <option value="active">{t('clients.active')}</option>
                  <option value="inactive">{t('clients.inactive')}</option>
                  <option value="converted">{t('clients.converted')}</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('clients.private_notes')}</label>
                <textarea 
                   name="notes" 
                   rows={3} 
                   value={formData.notes} 
                   onChange={handleChange} 
                   className="w-full px-4 py-2 border rounded-lg" 
                   placeholder="Internal notes about this client..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">{t('common.cancel')}</Button>
              <Button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">{t('clients.save_client')}</Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ClientDialog;
