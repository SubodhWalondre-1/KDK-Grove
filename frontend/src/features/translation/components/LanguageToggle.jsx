import { useEffect, useRef, useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { getLanguages } from '../../../api/translationApi';
import { useUIStore } from '../../../store/uiStore';

export default function LanguageToggle() {
  const activeLanguage = useUIStore((s) => s.activeLanguage);
  const setActiveLanguage = useUIStore((s) => s.setActiveLanguage);

  const [languages, setLanguages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    getLanguages()
      .then((data) => setLanguages(data.languages))
      .catch(() => setLanguages([{ code: 'en-IN', name: 'English' }, { code: 'hi-IN', name: 'Hindi' }]));
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = languages.find((l) => l.code === activeLanguage) || {
    code: activeLanguage,
    name: activeLanguage === 'en-IN' ? 'English' : 'Hindi',
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block', fontFamily: 'Poppins, sans-serif' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid #CBD5E1',
          backgroundColor: '#FFFFFF',
          color: '#1E293B',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.2s ease',
        }}
      >
        <Globe size={16} color="#4F46E5" />
        <span>{currentLang.name}</span>
        <ChevronDown size={14} color="#64748B" />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            width: '180px',
            maxHeight: '260px',
            overflowY: 'auto',
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E2E8F0',
            zIndex: 100,
            padding: '4px 0',
          }}
        >
          {languages.map((lang) => {
            const isSelected = lang.code === activeLanguage;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setActiveLanguage(lang.code);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '8px 14px',
                  border: 'none',
                  backgroundColor: isSelected ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                  color: isSelected ? '#4F46E5' : '#1E293B',
                  fontSize: '13px',
                  fontWeight: isSelected ? 600 : 400,
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                <span>{lang.name}</span>
                {isSelected && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4F46E5' }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
