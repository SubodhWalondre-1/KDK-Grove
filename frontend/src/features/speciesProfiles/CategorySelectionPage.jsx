import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { getProfiles, createProfile } from '../../api/speciesApi';
import { useProfileStore } from '../../store/profileStore';
import UserProfileMenu from '../../components/layout/UserProfileMenu';

export default function CategorySelectionPage() {
  const navigate = useNavigate();
  const setActiveProfile = useProfileStore((s) => s.setActiveProfile);
  const setProfiles = useProfileStore((s) => s.setProfiles);
  const profiles = useProfileStore((s) => s.profiles);

  const [loading, setLoading] = useState(true);
  const [processingCategory, setProcessingCategory] = useState(null);

  useEffect(() => {
    getProfiles()
      .then((data) => {
        setProfiles(data);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, [setProfiles]);

  const handleSelectCategory = async (categoryType) => {
    setProcessingCategory(categoryType);
    try {
      // Look for existing profile matching this category
      let existing = null;
      if (categoryType === 'human') {
        existing = profiles.find(
          (p) => (p.species_category || p.species || '').toLowerCase() === 'human'
        );
      } else {
        existing = profiles.find(
          (p) => (p.species_category || p.species || '').toLowerCase() !== 'human'
        );
      }

      if (existing) {
        setActiveProfile(existing);
      } else {
        // Create default profile for this category
        const newProfileData =
          categoryType === 'human'
            ? { profile_name: 'Human Patient', species: 'human' }
            : { profile_name: 'Animal Patient', species: 'dog' };

        const created = await createProfile(newProfileData);
        setProfiles([...profiles, created]);
        setActiveProfile(created);
      }

      // Navigate directly to Upload Page as requested
      navigate('/upload');
    } catch (err) {
      console.error('Error setting profile for category:', err);
      navigate('/upload');
    } finally {
      setProcessingCategory(null);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '32px 16px',
        boxSizing: 'border-box',
        fontFamily: 'Poppins, sans-serif',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Top-Right Profile Silhouette Menu */}
      <div
        style={{
          position: 'absolute',
          top: '24px',
          right: '32px',
          zIndex: 100,
        }}
      >
        <UserProfileMenu />
      </div>

      <div
        style={{
          fontFamily: 'Poppins, sans-serif',
          maxWidth: '1080px',
          width: '100%',
          margin: '0 auto',
          padding: '0 16px',
        }}
      >
        {/* Main Title & Subtitle Section */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h1
            style={{
              fontSize: '40px',
              fontWeight: 800,
              color: '#0F172A',
              margin: '0 0 12px',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Medical Report{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Analyzer
            </span>
          </h1>

          <p
            style={{
              fontSize: '15px',
              color: '#64748B',
              margin: '0 auto 24px',
              maxWidth: '640px',
              lineHeight: '1.6',
              fontWeight: 400,
            }}
          >
            Analyze medical reports using advanced AI technology for accurate diagnosis and better understanding.
          </p>

          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '2px',
              color: '#64748B',
              textTransform: 'uppercase',
            }}
          >
            CHOOSE PATIENT CATEGORY
          </div>
        </div>

        {/* 2 Category Cards Container */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '32px',
            maxWidth: '960px',
            margin: '0 auto',
          }}
        >
          {/* Card 1: Human */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: '28px 24px',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.05), 0 0 1px rgba(0,0,0,0.1)',
              border: '1px solid #F1F5F9',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
            }}
            className="category-card"
          >
            {/* Illustration image */}
            <div
              style={{
                width: '100%',
                height: '240px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <img
                src="/assets/human_category.png"
                alt="Human Medical Analysis"
                style={{
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>

            <h3
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#0F172A',
                margin: '0 0 8px',
              }}
            >
              Human
            </h3>

            <p
              style={{
                fontSize: '13.5px',
                color: '#64748B',
                margin: '0 0 24px',
                lineHeight: '1.5',
                minHeight: '40px',
                maxWidth: '300px',
              }}
            >
              Analyze blood reports, scans, prescriptions and laboratory results.
            </p>

            <button
              onClick={() => handleSelectCategory('human')}
              disabled={processingCategory !== null}
              style={{
                width: '100%',
                padding: '14px 24px',
                fontSize: '15px',
                fontWeight: 600,
                color: '#FFFFFF',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                border: 'none',
                borderRadius: '14px',
                cursor: processingCategory ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 20px -4px rgba(124, 58, 237, 0.35)',
                transition: 'all 0.2s ease',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {processingCategory === 'human' ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Selecting...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

          {/* Card 2: Animal */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: '28px 24px',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.05), 0 0 1px rgba(0,0,0,0.1)',
              border: '1px solid #F1F5F9',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
            }}
            className="category-card"
          >
            {/* Illustration image */}
            <div
              style={{
                width: '100%',
                height: '240px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <img
                src="/assets/animal_category.png"
                alt="Animal Medical Analysis"
                style={{
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>

            <h3
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#0F172A',
                margin: '0 0 8px',
              }}
            >
              Animal
            </h3>

            <p
              style={{
                fontSize: '13.5px',
                color: '#64748B',
                margin: '0 0 24px',
                lineHeight: '1.5',
                minHeight: '40px',
                maxWidth: '300px',
              }}
            >
              Analyze veterinary reports, laboratory results and animal health records.
            </p>

            <button
              onClick={() => handleSelectCategory('animal')}
              disabled={processingCategory !== null}
              style={{
                width: '100%',
                padding: '14px 24px',
                fontSize: '15px',
                fontWeight: 600,
                color: '#FFFFFF',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                border: 'none',
                borderRadius: '14px',
                cursor: processingCategory ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 20px -4px rgba(124, 58, 237, 0.35)',
                transition: 'all 0.2s ease',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {processingCategory === 'animal' ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Selecting...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .category-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 48px -12px rgba(124, 58, 237, 0.12), 0 0 1px rgba(0,0,0,0.1) !important;
          border-color: rgba(124, 58, 237, 0.2) !important;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
