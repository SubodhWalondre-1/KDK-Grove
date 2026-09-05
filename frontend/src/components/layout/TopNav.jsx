import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Bell, User as UserIcon, Users, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';
import { useNotificationPoll } from '../../hooks/useNotificationPoll';
import LanguageToggle from '../../features/translation/components/LanguageToggle';
import { useTranslation } from '../../i18n/translations';
import { colors } from '../../theme/colors';

export default function TopNav() {
  const { t } = useTranslation();

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const location = useLocation();
  const navigate = useNavigate();
  const { totalUnseen } = useNotificationPoll();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isDietPlanActive = location.pathname.includes('/diet-plan');
  const isUploadActive = (location.pathname === '/upload' || location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/reports')) && !isDietPlanActive;
  const isTrendsActive = location.pathname.includes('/trends');
  const isSharingActive = location.pathname.includes('/sharing');
  const isProfilesActive = location.pathname.includes('/profiles') && !location.pathname.includes('/trends') && !location.pathname.includes('/sharing') && !location.pathname.includes('/diet-plan');

  return (
    <header
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '12px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {/* Brand / Logo */}
      <Link to="/category" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <img
          src="/logo.png"
          alt="Mediora Logo"
          style={{
            height: '38px',
            width: 'auto',
            objectFit: 'contain',
          }}
        />
      </Link>

      {/* Nav Links translated */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link
          to="/upload"
          style={{
            fontSize: '14px',
            fontWeight: isUploadActive ? 600 : 500,
            color: isUploadActive ? colors.primary : '#64748B',
            textDecoration: 'none',
            padding: '8px 14px',
            borderRadius: '8px',
            backgroundColor: isUploadActive ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
            transition: 'all 0.15s ease',
          }}
        >
          {t('nav_upload')}
        </Link>

        <Link
          to={activeProfile ? `/profiles/${activeProfile.id}/trends` : '/trends'}
          style={{
            fontSize: '14px',
            fontWeight: isTrendsActive ? 600 : 500,
            color: isTrendsActive ? colors.primary : '#64748B',
            textDecoration: 'none',
            padding: '8px 14px',
            borderRadius: '8px',
            backgroundColor: isTrendsActive ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
            transition: 'all 0.15s ease',
          }}
        >
          {t('nav_trends')}
        </Link>

        <Link
          to="/diet-plan"
          style={{
            fontSize: '14px',
            fontWeight: isDietPlanActive ? 600 : 500,
            color: isDietPlanActive ? colors.primary : '#64748B',
            textDecoration: 'none',
            padding: '8px 14px',
            borderRadius: '8px',
            backgroundColor: isDietPlanActive ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
            transition: 'all 0.15s ease',
          }}
        >
          {t('nav_diet_plan')}
        </Link>

        <Link
          to={activeProfile ? `/profiles/${activeProfile.id}/sharing` : '/sharing'}
          style={{
            fontSize: '14px',
            fontWeight: isSharingActive ? 600 : 500,
            color: isSharingActive ? colors.primary : '#64748B',
            textDecoration: 'none',
            padding: '8px 14px',
            borderRadius: '8px',
            backgroundColor: isSharingActive ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
            transition: 'all 0.15s ease',
          }}
        >
          {t('nav_sharing')}
        </Link>

        <Link
          to="/profiles"
          style={{
            fontSize: '14px',
            fontWeight: isProfilesActive ? 600 : 500,
            color: isProfilesActive ? colors.primary : '#64748B',
            textDecoration: 'none',
            padding: '8px 14px',
            borderRadius: '8px',
            backgroundColor: isProfilesActive ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
            transition: 'all 0.15s ease',
          }}
        >
          {t('nav_profiles')}
        </Link>
      </nav>

      {/* Action Icons & Profile Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Active Profile Indicator Pill */}
        <Link
          to="/profiles"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: activeProfile ? 'rgba(79, 70, 229, 0.06)' : 'rgba(245, 158, 11, 0.08)',
            border: `1px solid ${activeProfile ? 'rgba(79, 70, 229, 0.2)' : 'rgba(245, 158, 11, 0.3)'}`,
            borderRadius: '20px',
            textDecoration: 'none',
            fontSize: '12px',
            fontWeight: 600,
            color: activeProfile ? colors.primary : '#B45309',
            transition: 'all 0.2s ease',
          }}
          title="Switch Patient Profile"
        >
          <Users size={15} />
          <span>
            {activeProfile
              ? `${activeProfile.profile_name} (${activeProfile.species})`
              : t('nav_select_profile')}
          </span>
        </Link>

        {/* Language Toggle */}
        <LanguageToggle />

        {/* Audit Notifications / Bell Button */}
        <button
          type="button"
          onClick={() =>
            navigate(activeProfile ? `/profiles/${activeProfile.id}/sharing` : '/sharing')
          }
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#64748B',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            padding: '6px',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
          }}
          title="Audit Notifications & Shared Links"
        >
          <Bell size={20} />
          {totalUnseen > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '0px',
                right: '0px',
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: 700,
                borderRadius: '10px',
                padding: '2px 5px',
                minWidth: '14px',
                textAlign: 'center',
                lineHeight: '1',
                boxShadow: '0 0 0 2px #FFFFFF',
              }}
            >
              {totalUnseen > 9 ? '9+' : totalUnseen}
            </span>
          )}
        </button>

        {/* User Account Menu with Logout Dropdown */}
        <div ref={userDropdownRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: '#F1F5F9',
              border: '1px solid #E2E8F0',
              borderRadius: '20px',
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <UserIcon size={18} color={colors.primary} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>
              {user?.name || 'User'}
            </span>
            <ChevronDown size={14} color="#64748B" />
          </button>

          {userDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '200px',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
                border: '1px solid #E2E8F0',
                zIndex: 100,
                padding: '8px 0',
              }}
            >
              <div
                style={{
                  padding: '8px 16px 10px',
                  borderBottom: '1px solid #E2E8F0',
                  marginBottom: '4px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                  {user?.name || 'User'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email || 'user@mediora.dev'}
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#EF4444',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'Poppins, sans-serif',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <LogOut size={16} />
                <span>{t('nav_logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
