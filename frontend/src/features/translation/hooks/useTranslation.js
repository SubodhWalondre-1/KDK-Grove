import { useCallback, useEffect, useState } from 'react';
import { bulkTranslate } from '../../../api/translationApi';
import { useUIStore } from '../../../store/uiStore';

export function useTranslation() {
  const activeLanguage = useUIStore((s) => s.activeLanguage);

  const translateItems = useCallback(
    async (items) => {
      const resultMap = new Map();
      if (!items || items.length === 0) return resultMap;

      if (activeLanguage === 'en-IN' || activeLanguage === 'en') {
        for (const item of items) {
          resultMap.set(`${item.source_type}:${item.source_key}`, item.source_key);
        }
        return resultMap;
      }

      try {
        const response = await bulkTranslate(items, activeLanguage);
        for (const item of response.translations) {
          resultMap.set(`${item.source_type}:${item.source_key}`, item.translated_text);
        }
      } catch (err) {
        // Fallback to original English on network/API failure
        for (const item of items) {
          resultMap.set(`${item.source_type}:${item.source_key}`, item.source_key);
        }
      }

      return resultMap;
    },
    [activeLanguage]
  );

  return { activeLanguage, translateItems };
}

export function useTranslatedLabels(items = []) {
  const activeLanguage = useUIStore((s) => s.activeLanguage);
  const [translations, setTranslations] = useState(new Map());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!items || items.length === 0) {
      setTranslations(new Map());
      return;
    }

    if (activeLanguage === 'en-IN' || activeLanguage === 'en') {
      const resultMap = new Map();
      for (const item of items) {
        resultMap.set(`${item.source_type}:${item.source_key}`, item.source_key);
      }
      setTranslations(resultMap);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    bulkTranslate(items, activeLanguage)
      .then((data) => {
        if (cancelled) return;
        const resultMap = new Map();
        for (const item of data.translations) {
          resultMap.set(`${item.source_type}:${item.source_key}`, item.translated_text);
        }
        setTranslations(resultMap);
      })
      .catch(() => {
        if (cancelled) return;
        // Fallback to English source text on error
        const resultMap = new Map();
        for (const item of items) {
          resultMap.set(`${item.source_type}:${item.source_key}`, item.source_key);
        }
        setTranslations(resultMap);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeLanguage, JSON.stringify(items)]);

  return { translations, isLoading, activeLanguage };
}
