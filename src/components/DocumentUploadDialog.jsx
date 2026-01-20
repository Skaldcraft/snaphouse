import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Papa from 'papaparse';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const DocumentUploadDialog = ({ open, onClose, onSuccess }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [importType, setImportType] = useState('property');
  const [parsedData, setParsedData] = useState([]);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParsedData([]);
      parseFile(selectedFile);
    }
  };

  const parseFile = async (file) => {
    setLoading(true);
    const fileType = file.name.split('.').pop().toLowerCase();

    try {
      let data = [];
      if (fileType === 'csv') {
        data = await parseCSV(file);
      } else if (fileType === 'pdf') {
        data = await parsePDF(file);
      } else if (fileType === 'docx') {
        data = await parseDOCX(file);
      } else {
        throw new Error('Unsupported file type');
      }

      const mapped = mapData(data);
      if (mapped.length === 0) {
        toast({ variant: "destructive", title: t('import.no_data') });
      }
      setParsedData(mapped);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: t('common.error'), description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error),
      });
    });
  };

  const parsePDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return extractFromText(fullText);
  };

  const parseDOCX = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return extractFromText(result.value);
  };

  // Heuristic parser for unstructured text (PDF/Word)
  const extractFromText = (text) => {
    const lines = text.split('\n');
    const items = [];
    let currentItem = {};

    // Simple heuristic: If we see a "Price" or "Name" field, we assume it's a start of a record or part of one.
    // This is a basic implementation.
    
    // Regex patterns
    const priceRegex = /(?:Price|Precio):\s*\$?([\d,]+)/i;
    const nameRegex = /(?:Name|Nombre):\s*(.+)/i;
    const emailRegex = /(?:Email|Correo):\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i;
    const phoneRegex = /(?:Phone|Tel|Telefono):\s*([+\d\s()-]+)/i;
    const propTypeRegex = /(?:Type|Tipo):\s*(.+)/i;
    
    // Treat whole text as one item if it's small, or split by double newlines for multiple items
    const blocks = text.split(/\n\s*\n/); 

    blocks.forEach(block => {
        const item = {};
        const priceMatch = block.match(priceRegex);
        const nameMatch = block.match(nameRegex);
        const emailMatch = block.match(emailRegex);
        const phoneMatch = block.match(phoneRegex);
        const typeMatch = block.match(propTypeRegex);

        if (priceMatch) item.price = priceMatch[1].replace(/,/g, '');
        if (nameMatch) item.name = nameMatch[1].trim();
        if (emailMatch) item.email = emailMatch[1].trim();
        if (phoneMatch) item.phone = phoneMatch[1].trim();
        if (typeMatch) item.property_type = typeMatch[1].trim();

        // Fallback for title/description if block has content
        if (Object.keys(item).length > 0) {
             // Use first line as title/name if not found
             const firstLine = block.trim().split('\n')[0];
             if (!item.name && !item.title) item.title = firstLine;
             if (!item.name) item.name = firstLine;
             item.description = block.trim();
             items.push(item);
        }
    });

    return items;
  };

  const mapData = (data) => {
    return data.map(item => {
      if (importType === 'property') {
        return {
          title: item.title || item.Title || item.name || 'Untitled Property',
          description: item.description || item.Description || '',
          location: item.location || item.Location || '',
          price: parseFloat(item.price || item.Price || 0),
          bedrooms: parseInt(item.bedrooms || item.Bedrooms || 0),
          bathrooms: parseInt(item.bathrooms || item.Bathrooms || 0),
          area: parseFloat(item.area || item.Area || 0),
          property_type: (item.property_type || item.Type || 'house').toLowerCase(),
          status: 'available',
          user_id: user.id
        };
      } else {
        // Buyer or Seller
        return {
          name: item.name || item.Name || item.title || 'Unknown Name',
          email: item.email || item.Email || '',
          phone: item.phone || item.Phone || '',
          company: item.company || item.Company || '',
          client_type: importType === 'buyer' ? 'buyer' : 'seller',
          status: 'active',
          user_id: user.id
        };
      }
    });
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    setLoading(true);

    try {
      let table = '';
      if (importType === 'property') table = 'properties';
      else if (importType === 'buyer') table = 'buyers';
      else if (importType === 'seller') table = 'sellers';

      const { error } = await supabase.from(table).insert(parsedData);
      
      if (error) throw error;

      // If buyer or seller, ALSO insert into 'contacts' for visibility in existing UI
      if (importType === 'buyer' || importType === 'seller') {
          const contactData = parsedData.map(p => ({
              user_id: user.id,
              name: p.name, // buyers/sellers table has 'nombre' in schema, but we mapped to 'name' above. 
                            // Wait, schema says buyers table has 'nombre'. We should map correctly for the specific table.
                            // Let's re-map for the specific table insert above if needed.
                            // Actually, Supabase is flexible if we send JSON, but column names must match.
                            // Schema check: buyers(nombre, telefono, email). contacts(name, email, phone).
                            // We need to transform for buyers/sellers specifically.
              email: p.email,
              phone: p.phone,
              client_type: p.client_type,
              status: 'active'
          }));

           // Correcting the initial insert for buyers/sellers based on schema Spanish names
           const spanishData = parsedData.map(p => ({
              user_id: user.id,
              nombre: p.name,
              telefono: p.phone,
              email: p.email,
              ...(importType === 'seller' ? { propiedades: '' } : {})
           }));

           // Retry the specific table insert with correct columns
           await supabase.from(table).insert(spanishData);

           // Now insert to contacts
           await supabase.from('contacts').insert(contactData);
      }

      toast({ 
        title: t('import.import_success'), 
        description: `${parsedData.length} ${t('import.import_desc')}` 
      });
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: t('import.import_error'), description: error.message });
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
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
        >
          <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div>
               <h2 className="text-xl font-bold text-slate-900">{t('import.title')}</h2>
               <p className="text-sm text-slate-500">{t('import.subtitle')}</p>
            </div>
            <button onClick={onClose}><X className="h-6 w-6 text-slate-400 hover:text-slate-600" /></button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('import.select_type')}</label>
              <select 
                className="w-full p-2 border rounded-lg bg-white"
                value={importType}
                onChange={(e) => { setImportType(e.target.value); setParsedData([]); setFile(null); }}
              >
                <option value="property">{t('import.add_property')}</option>
                <option value="buyer">{t('import.add_buyer')}</option>
                <option value="seller">{t('import.add_seller')}</option>
              </select>
            </div>

            <div 
               className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer"
               onClick={() => fileInputRef.current.click()}
            >
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 accept=".csv,.pdf,.docx" 
                 onChange={handleFileChange}
               />
               <Upload className="h-10 w-10 text-slate-400 mx-auto mb-2" />
               <p className="text-sm font-medium text-slate-900">
                 {file ? file.name : t('import.drop_file')}
               </p>
               <p className="text-xs text-slate-500 mt-1">{t('import.supports')}</p>
            </div>

            {loading && (
               <div className="flex items-center justify-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  <span className="text-sm">{t('import.parsing')}</span>
               </div>
            )}

            {!loading && parsedData.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                 <div className="flex items-center gap-2 text-green-700 mb-2">
                    <Check className="h-5 w-5" />
                    <span className="font-bold">{t('import.review')}</span>
                 </div>
                 <p className="text-sm text-green-600 mb-3">
                    Found {parsedData.length} records ready to import as <strong>{importType}</strong>.
                 </p>
                 <div className="max-h-32 overflow-y-auto text-xs bg-white p-2 rounded border border-green-100 space-y-1">
                    {parsedData.map((item, i) => (
                       <div key={i} className="truncate">
                          {i + 1}. {item.title || item.name} {item.price ? `($${item.price})` : ''}
                       </div>
                    ))}
                 </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">{t('common.cancel')}</Button>
              <Button 
                 onClick={handleImport} 
                 disabled={loading || parsedData.length === 0} 
                 className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                 {t('import.import_btn')}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DocumentUploadDialog;