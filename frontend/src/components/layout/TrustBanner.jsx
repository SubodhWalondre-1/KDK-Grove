import { Shield, Clock, Bell } from 'lucide-react';

export default function TrustBanner() {
  return (
    <div
      style={{
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
        borderRadius: '16px',
        padding: '24px 36px',
        marginTop: '40px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '24px',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div
          style={{
            padding: '10px',
            backgroundColor: 'rgba(79, 70, 229, 0.2)',
            borderRadius: '12px',
            color: '#818CF8',
          }}
        >
          <Shield size={24} />
        </div>
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 4px', color: '#F8FAFC' }}>
            Your Data is Safe
          </h4>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
            We never share your data without your permission.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div
          style={{
            padding: '10px',
            backgroundColor: 'rgba(124, 58, 237, 0.2)',
            borderRadius: '12px',
            color: '#C084FC',
          }}
        >
          <Clock size={24} />
        </div>
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 4px', color: '#F8FAFC' }}>
            Access History
          </h4>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
            See who accessed your report and when.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div
          style={{
            padding: '10px',
            backgroundColor: 'rgba(6, 182, 212, 0.2)',
            borderRadius: '12px',
            color: '#22D3EE',
          }}
        >
          <Bell size={24} />
        </div>
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 4px', color: '#F8FAFC' }}>
            Smart Alerts
          </h4>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
            Get notified if your report is accessed by others.
          </p>
        </div>
      </div>
    </div>
  );
}
