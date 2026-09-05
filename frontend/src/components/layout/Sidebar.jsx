import { Link, useLocation } from 'react-router-dom';
import {
  FileText,
  Activity,
  Utensils,
  Share2,
  Users,
} from 'lucide-react';
import { colors } from '../../utils/constants';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  const links = [
    { name: 'Upload Report', path: '/upload', icon: FileText },
    { name: 'Health Insights', path: '/trends', icon: Activity },
    { name: 'Diet Plan', path: '/diet-plan', icon: Utensils },
    { name: 'Shared Links', path: '/sharing', icon: Share2 },
    { name: 'Profiles', path: '/profiles', icon: Users },
  ];

  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        minHeight: '100vh',
        padding: '24px 16px',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname.startsWith(link.path);
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? colors.primary : '#64748B',
                backgroundColor: isActive ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={18} />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
