import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  Users,
  TrendingUp,
  Sparkles,
  Utensils,
  Share2,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';

export default function UserProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const activeProfile = useProfileStore((s) => s.activeProfile);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close dropdown when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/login');
  };

  const handleNavigate = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  const menuItems = [
    {
      id: 'my-profile',
      label: 'My Profiles / Patients',
      icon: Users,
      onClick: () => handleNavigate('/profiles'),
    },
    {
      id: 'results',
      label: 'Results & Health Insights',
      icon: TrendingUp,
      onClick: () =>
        handleNavigate(
          activeProfile ? `/profiles/${activeProfile.id}/trends` : '/trends'
        ),
    },
    {
      id: 'recommendation',
      label: 'Recommendation',
      icon: Sparkles,
      onClick: () => {
        if (activeProfile?.latest_report_id) {
          handleNavigate(`/reports/${activeProfile.latest_report_id}/recommendations`);
        } else {
          handleNavigate(activeProfile ? `/profiles/${activeProfile.id}/trends` : '/trends');
        }
      },
    },
    {
      id: 'diet-plan',
      label: 'Diet & Nutrition Plan',
      icon: Utensils,
      onClick: () => handleNavigate('/diet-plan'),
    },
    {
      id: 'sharing',
      label: 'Shared Links & Access',
      icon: Share2,
      onClick: () =>
        handleNavigate(
          activeProfile ? `/profiles/${activeProfile.id}/sharing` : '/sharing'
        ),
    },
  ];

  return (
    <div
      ref={menuRef}
      style={{
        position: 'relative',
        display: 'inline-block',
        zIndex: 100,
      }}
    >
      {/* Profile Silhouette Trigger Button */}
      <button
        type="button"
        id="profile-silhouette-btn"
        aria-label="User Profile Menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          border: '1.5px solid #E2E8F0',
          boxShadow: '0 4px 14px rgba(30, 41, 59, 0.08)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#4F46E5',
          transition: 'all 0.2s ease',
          outline: 'none',
          padding: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#A5B4FC';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.16)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#E2E8F0';
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(30, 41, 59, 0.08)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <User size={22} strokeWidth={2.2} />
      </button>

      {/* Dropdown Menu Card with Smooth RotateX 3D Animation */}
      {isOpen && (
        <div
          id="profile-dropdown-menu"
          className="dropdown-menu-rotatex"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '270px',
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.16), 0 0 1px rgba(15, 23, 42, 0.1)',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            fontFamily: 'Poppins, sans-serif',
            transformOrigin: 'top center',
            animation: 'rotateMenu 320ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {/* User Account Info Header */}
          <div
            style={{
              padding: '16px 18px 12px',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                color: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1.5px solid rgba(79, 70, 229, 0.2)',
              }}
            >
              <User size={20} strokeWidth={2.2} />
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: '#0F172A',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.name || 'User Account'}
              </div>
              <div
                style={{
                  fontSize: '11.5px',
                  color: '#64748B',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.email || 'patient@mediora.dev'}
              </div>
            </div>
          </div>

          {/* Active Patient Indicator Pill */}
          {activeProfile && (
            <div
              style={{
                padding: '7px 18px',
                backgroundColor: '#EEF2FF',
                borderBottom: '1px solid #E0E7FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#4F46E5' }}>
                Active Patient:
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#3730A3',
                  maxWidth: '140px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {activeProfile.profile_name} ({activeProfile.species || 'general'})
              </span>
            </div>
          )}

          {/* Clean Menu Items */}
          <div style={{ padding: '6px 0' }}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  style={{
                    width: '100%',
                    padding: '11px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F8FAFC';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#4F46E5',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} strokeWidth={2} />
                  </div>
                  <span
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: '#1E293B',
                      flex: 1,
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sign Out Section */}
          <div
            style={{
              padding: '6px 10px 8px',
              borderTop: '1px solid #F1F5F9',
              backgroundColor: '#FAFAFA',
            }}
          >
            <button
              type="button"
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#EF4444',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                fontFamily: 'Poppins, sans-serif',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FEF2F2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <LogOut size={16} strokeWidth={2.2} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* RotateX 3D Animation without viewport spill */}
      <style>{`
        @keyframes rotateMenu {
          0% {
            opacity: 0;
            transform: perspective(800px) rotateX(-45deg);
          }
          70% {
            opacity: 1;
            transform: perspective(800px) rotateX(8deg);
          }
          100% {
            opacity: 1;
            transform: perspective(800px) rotateX(0deg);
          }
        }
      `}</style>
    </div>
  );
}
