
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '@/lib/i18n';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('snaphouse_language') || 'en';
  });

  // Sync with Supabase when user logs in
  useEffect(() => {
    const syncLanguagePreference = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('language_preference')
            .eq('id', user.id)
            .maybeSingle();
          
          if (error) {
            console.error('Error fetching language preference:', error);
            return;
          }

          // If we have a stored preference in database, use it.
          // data?.language_preference checks if data exists AND language_preference is not null
          if (data?.language_preference) {
             setLanguageState(data.language_preference);
             localStorage.setItem('snaphouse_language', data.language_preference);
          } else {
             // If no preference in DB (or user row missing), we sync our current local preference to DB.
             // This ensures the DB gets populated with a valid default/current selection.
             // We default to 'es' if for some reason language state is missing (unlikely due to useState default).
             const langToSave = language || 'es';
             
             // We only attempt update if we think we might have a row, or if we want to ensure it's saved.
             // Since triggers usually create the user row, this update should work for existing rows with null preference.
             await supabase
               .from('users')
               .update({ language_preference: langToSave })
               .eq('id', user.id);
          }
        } catch (error) {
           console.error('Error syncing language preference:', error);
        }
      }
    };
    
    syncLanguagePreference();
  }, [user]); // Run when user state changes

  const setLanguage = async (lang) => {
    if (lang === 'en' || lang === 'es') {
      setLanguageState(lang);
      localStorage.setItem('snaphouse_language', lang);

      // Persist to Supabase if user is logged in
      if (user) {
         try {
             await supabase
               .from('users')
               .update({ language_preference: lang })
               .eq('id', user.id);
         } catch (error) {
             console.error('Error saving language preference:', error);
         }
      }
    }
  };

  const t = (path) => {
    const keys = path.split('.');
    let current = translations[language];
    let fallback = translations['en'];

    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        current = undefined;
      }
      
      if (fallback && fallback[key] !== undefined) {
        fallback = fallback[key];
      } else {
        fallback = undefined;
      }
    }

    return current || fallback || path;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
