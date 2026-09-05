import apiClient from './client';

export const bulkTranslate = async (items, languageCode) => {
  const response = await apiClient.post('/api/translations/bulk', {
    items,
    language_code: languageCode,
  });
  return response.data;
};

export const getLanguages = async () => {
  const response = await apiClient.get('/api/languages');
  return response.data;
};

export const addGlossaryEntry = async (termEn, languageCode, translatedTerm, adminKey) => {
  const response = await apiClient.post(
    '/api/glossary',
    {
      term_en: termEn,
      language_code: languageCode,
      translated_term: translatedTerm,
    },
    {
      headers: {
        'X-Admin-Key': adminKey,
      },
    }
  );
  return response.data;
};

export const translationApi = {
  bulkTranslate,
  getLanguages,
  addGlossaryEntry,
};

export default translationApi;
