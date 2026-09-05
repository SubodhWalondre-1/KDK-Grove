import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Dog, Cat, Bird, PawPrint, Plus, Loader2 } from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import { getProfiles } from '../../api/speciesApi';
import { useProfileStore } from '../../store/profileStore';
import { colors } from '../../theme/colors';

const SPECIES_ICONS = {
  human: User,
  canine: Dog,
  feline: Cat,
  avian: Bird,
  bovine: PawPrint,
  other: PawPrint,
};

export default function ProfileListPage() {
  const navigate = useNavigate();
  const setActiveProfile = useProfileStore((s) => s.setActiveProfile);
  const setProfiles = useProfileStore((s) => s.setProfiles);
  const profiles = useProfileStore((s) => s.profiles);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getProfiles()
      .then((data) => {
        setProfiles(data);
      })
      .catch((err) => {
        setError('Failed to load profiles');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [setProfiles]);

  const handleSelectProfile = (profile) => {
    setActiveProfile(profile);
    navigate('/upload');
  };

  return (
    <PageLayout>
      <div
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: colors.textPrimary, margin: '0 0 4px' }}>
              Patient Profiles
            </h1>
            <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
              Select a profile to analyze lab reports or manage patient care
            </p>
          </div>

          <button
            onClick={() => navigate('/profiles/new')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#FFFFFF',
              background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <Plus size={18} />
            <span>New Profile</span>
          </button>
        </div>

        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 0',
              color: colors.primary,
              gap: '10px',
            }}
          >
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '15px', fontWeight: 500 }}>Loading profiles…</span>
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : error ? (
          <div
            style={{
              padding: '16px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '10px',
              color: colors.danger,
              textAlign: 'center',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        ) : profiles.length === 0 ? (
          /* Empty state */
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                color: colors.primary,
                marginBottom: '16px',
              }}
            >
              <User size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: colors.textPrimary, margin: '0 0 8px' }}>
              No profiles yet
            </h3>
            <p style={{ fontSize: '14px', color: colors.textSecondary, margin: '0 0 24px', maxWidth: '400px', marginInline: 'auto' }}>
              Create your first profile for yourself, a family member, or a pet to start uploading medical lab reports.
            </p>
            <button
              onClick={() => navigate('/profiles/new')}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#FFFFFF',
                background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Create Profile
            </button>
          </div>
        ) : (
          /* Profile Cards Grid */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {profiles.map((profile) => {
              const category = profile.species_category || 'human';
              const IconComponent = SPECIES_ICONS[category] || SPECIES_ICONS.other;

              return (
                <div
                  key={profile.id}
                  onClick={() => handleSelectProfile(profile)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(79, 70, 229, 0.1)',
                      color: colors.primary,
                      flexShrink: 0,
                    }}
                  >
                    <IconComponent size={24} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: colors.textPrimary,
                        margin: '0 0 2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {profile.profile_name}
                    </h3>
                    <p style={{ fontSize: '12px', color: colors.textSecondary, margin: 0 }}>
                      <span style={{ textTransform: 'capitalize' }}>{profile.species}</span>
                      {profile.breed && ` · ${profile.breed}`}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* "+ New Profile" Card */}
            <div
              onClick={() => navigate('/profiles/new')}
              style={{
                backgroundColor: 'rgba(79, 70, 229, 0.04)',
                borderRadius: '14px',
                border: '2px dashed rgba(79, 70, 229, 0.3)',
                padding: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                minHeight: '84px',
                color: colors.primary,
                fontWeight: 600,
                fontSize: '14px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.04)';
              }}
            >
              <Plus size={20} />
              <span>New Profile</span>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
