import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, UserPlus, Loader2 } from 'lucide-react';
import { getSpecies, createProfile } from '../../../api/speciesApi';
import { useProfileStore } from '../../../store/profileStore';
import { colors } from '../../../theme/colors';

export default function ProfileForm({ onSuccess }) {
  const navigate = useNavigate();
  const setActiveProfile = useProfileStore((s) => s.setActiveProfile);
  const addProfile = useProfileStore((s) => s.addProfile);

  const [speciesOptions, setSpeciesOptions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('human');
  const [customSpecies, setCustomSpecies] = useState('');
  const [profileName, setProfileName] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [breed, setBreed] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSpecies()
      .then((data) => setSpeciesOptions(data.species))
      .catch(() => {
        // Fallback static list if network error
        setSpeciesOptions([
          { category: 'human', display_name: 'Human', reference_data_available: true },
          { category: 'canine', display_name: 'Dog', reference_data_available: true },
          { category: 'feline', display_name: 'Cat', reference_data_available: true },
          { category: 'bovine', display_name: 'Cow / Cattle', reference_data_available: false },
          { category: 'avian', display_name: 'Bird', reference_data_available: false },
          { category: 'other', display_name: 'Other', reference_data_available: false },
        ]);
      });
  }, []);

  const currentOption = speciesOptions.find((opt) => opt.category === selectedCategory);
  const showCoverageWarning = currentOption && !currentOption.reference_data_available;
  const isHuman = selectedCategory === 'human';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setError('Profile name is required');
      return;
    }

    const speciesValue =
      selectedCategory === 'other'
        ? customSpecies.trim() || 'other'
        : selectedCategory === 'canine'
        ? 'dog'
        : selectedCategory === 'feline'
        ? 'cat'
        : selectedCategory === 'bovine'
        ? 'cow'
        : selectedCategory === 'avian'
        ? 'bird'
        : selectedCategory;

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        profile_name: profileName.trim(),
        species: speciesValue,
        gender: gender || null,
        date_of_birth: dateOfBirth || null,
        breed: isHuman ? null : breed.trim() || null,
      };

      const newProfile = await createProfile(payload);
      addProfile(newProfile);
      setActiveProfile(newProfile);

      if (onSuccess) {
        onSuccess(newProfile);
      } else {
        navigate('/upload');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
        padding: '24px',
        fontFamily: 'Poppins, sans-serif',
        maxWidth: '500px',
        width: '100%',
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            color: colors.primary,
          }}
        >
          <UserPlus size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
            Add New Patient Profile
          </h2>
          <p style={{ fontSize: '12px', color: colors.textSecondary, margin: 0 }}>
            For humans or animals / multi-species care
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            color: colors.danger,
            fontSize: '13px',
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      {/* Profile Name */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.textPrimary, marginBottom: '6px' }}>
          Profile / Patient Name *
        </label>
        <input
          type="text"
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
          placeholder="e.g. Rahul Kumar or Buddy"
          required
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: '14px',
            borderRadius: '8px',
            border: '1px solid #CBD5E1',
            outline: 'none',
            fontFamily: 'Poppins, sans-serif',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Species Category Selector */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.textPrimary, marginBottom: '6px' }}>
          Species Category *
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: '14px',
            borderRadius: '8px',
            border: '1px solid #CBD5E1',
            backgroundColor: '#FFFFFF',
            outline: 'none',
            fontFamily: 'Poppins, sans-serif',
            boxSizing: 'border-box',
          }}
        >
          {speciesOptions.map((opt) => (
            <option key={opt.category} value={opt.category}>
              {opt.display_name}
            </option>
          ))}
        </select>
      </div>

      {/* Custom Species Free-Text (Revealed when "Other" selected) */}
      {selectedCategory === 'other' && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.textPrimary, marginBottom: '6px' }}>
            Specify Species *
          </label>
          <input
            type="text"
            value={customSpecies}
            onChange={(e) => setCustomSpecies(e.target.value)}
            placeholder="e.g. Rabbit, Goat, Horse"
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              outline: 'none',
              fontFamily: 'Poppins, sans-serif',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* Coverage Warning Banner */}
      {showCoverageWarning && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '10px 12px',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#B45309',
            marginBottom: '16px',
            lineHeight: '1.4',
          }}
        >
          <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            Full reference range coverage for this species is coming soon — some values may show as 'reference data unavailable'.
          </span>
        </div>
      )}

      {/* Gender (Optional) */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.textPrimary, marginBottom: '6px' }}>
          Gender (Optional)
        </label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: '14px',
            borderRadius: '8px',
            border: '1px solid #CBD5E1',
            backgroundColor: '#FFFFFF',
            outline: 'none',
            fontFamily: 'Poppins, sans-serif',
            boxSizing: 'border-box',
          }}
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
          <option value="Unknown">Unknown</option>
        </select>
      </div>

      {/* Date of Birth (Optional) */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.textPrimary, marginBottom: '6px' }}>
          Date of Birth (Optional)
        </label>
        <input
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: '14px',
            borderRadius: '8px',
            border: '1px solid #CBD5E1',
            outline: 'none',
            fontFamily: 'Poppins, sans-serif',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Breed (Hidden for Humans) */}
      {!isHuman && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.textPrimary, marginBottom: '6px' }}>
            Breed (Optional)
          </label>
          <input
            type="text"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            placeholder="e.g. German Shepherd, Persian Cat"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              outline: 'none',
              fontFamily: 'Poppins, sans-serif',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '14px',
          fontWeight: 600,
          color: '#FFFFFF',
          background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
          border: 'none',
          borderRadius: '10px',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          fontFamily: 'Poppins, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Creating Profile…</span>
          </>
        ) : (
          <span>Create Profile</span>
        )}
      </button>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
}
