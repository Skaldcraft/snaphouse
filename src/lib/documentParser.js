
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import Papa from 'papaparse';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const parseDocument = async (file) => {
  const fileType = file.name.split('.').pop().toLowerCase();
  let text = '';

  try {
    if (fileType === 'txt') {
      text = await file.text();
    } else if (fileType === 'csv') {
      text = await parseCSV(file);
    } else if (fileType === 'pdf') {
      text = await parsePDF(file);
    } else if (fileType === 'docx') {
      text = await parseDOCX(file);
    } else {
      throw new Error('Unsupported file type');
    }
    return text;
  } catch (error) {
    console.error('Error parsing document:', error);
    throw error;
  }
};

const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        // Convert CSV data to a string representation for regex matching
        const text = results.data.map(row => Object.values(row).join(' ')).join('\n');
        resolve(text);
      },
      error: (error) => reject(error),
      header: true // Treat as key-value pairs if possible, but we flatten for generic extraction
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
  return fullText;
};

const parseDOCX = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

export const extractClientInfo = (text) => {
  // Simple heuristics/regex for common fields
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i;
  const phoneRegex = /(?:Phone|Tel|Mobile|Cel|Tlf)?\s*:?\s*(\+?[\d\s()-]{7,})/i;
  const nameRegex = /(?:Name|Nombre|Client|Cliente)\s*:?\s*([A-Za-z\s]+)/i;
  
  // Try to find name in the first few lines if not explicit
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  let name = '';
  
  const nameMatch = text.match(nameRegex);
  if (nameMatch) {
    name = nameMatch[1].trim();
  } else if (lines.length > 0) {
    // Fallback: assume first non-empty line might be name if it's short
    if (lines[0].length < 50 && !lines[0].includes('@')) {
       name = lines[0];
    }
  }

  const emailMatch = text.match(emailRegex);
  const phoneMatch = text.match(phoneRegex);

  return {
    name: name,
    email: emailMatch ? emailMatch[1] : '',
    phone: phoneMatch ? phoneMatch[1].trim() : '',
    notes: text.substring(0, 500) // Keep first 500 chars as notes context
  };
};

export const extractPropertyInfo = (text) => {
  const textLower = text.toLowerCase();
  
  // Regex patterns
  const priceRegex = /(?:Price|Precio|Valor)\s*:?\s*\$?\s*([\d,.]+)/i;
  const bedsRegex = /(\d+)\s*(?:beds|bedrooms|hab|habitaciones|dormitorios)/i;
  const bathsRegex = /(\d+)\s*(?:baths|bathrooms|baños)/i;
  const areaRegex = /(\d+(?:[,.]\d+)?)\s*(?:sqft|m2|sq\s*m|meters|metros)/i;
  
  // Extraction
  const priceMatch = text.replace(/\./g, '').match(priceRegex); // Remove dots to handle European format roughly or standard
  const bedsMatch = text.match(bedsRegex);
  const bathsMatch = text.match(bathsRegex);
  const areaMatch = text.match(areaRegex);

  // Type detection
  let type = 'house';
  if (textLower.includes('apartment') || textLower.includes('piso') || textLower.includes('flat')) type = 'apartment';
  if (textLower.includes('condo')) type = 'condo';
  if (textLower.includes('land') || textLower.includes('terreno')) type = 'land';
  if (textLower.includes('townhouse') || textLower.includes('adosado')) type = 'townhouse';

  // Operation detection
  let operation = 'sale';
  if (textLower.includes('rent') || textLower.includes('alquiler')) operation = 'rent';

  // Location heuristic: Look for "Location:" or just use first line if not found
  const locationRegex = /(?:Location|Ubicación|Address|Dirección)\s*:?\s*(.+)/i;
  const locationMatch = text.match(locationRegex);
  
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  let title = lines[0] || '';
  if (title.length > 100) title = title.substring(0, 97) + '...';

  return {
    title: title,
    description: text.substring(0, 1000), // First 1000 chars
    price: priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '').replace(/\./g, '')) : 0, // Very rough parsing
    bedrooms: bedsMatch ? parseInt(bedsMatch[1]) : 0,
    bathrooms: bathsMatch ? parseInt(bathsMatch[1]) : 0,
    area: areaMatch ? parseFloat(areaMatch[1].replace(',', '.')) : 0,
    property_type: type,
    operation_type: operation,
    location: locationMatch ? locationMatch[1].trim() : (lines.length > 1 ? lines[1] : ''),
  };
};
