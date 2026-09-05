import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import LineTrendChart from '../../../charts/LineTrendChart';
import { colors } from '../../../theme/colors';

const TIMEFRAMES = [
  { id: '1m', label: 'Last 1 Month' },
  { id: '3m', label: 'Last 3 Months' },
  { id: '6m', label: 'Last 6 Months' },
  { id: '1y', label: 'All Time' },
];

export default function TrendsOverTimeCard({ trendData }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('6m');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getTimeframeLabels = () => {
    if (selectedTimeframe === '1m') return ['May 1', 'May 10', 'May 20', 'May 30'];
    if (selectedTimeframe === '3m') return ['Mar 2025', 'Apr 2025', 'May 2025'];
    if (selectedTimeframe === '1y') return ['Jan 2024', 'May 2024', 'Sep 2024', 'Jan 2025', 'May 2025'];
    return ['Dec 2024', 'Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025', 'May 2025'];
  };

  const labels = trendData?.labels?.length > 0 && selectedTimeframe === '6m'
    ? trendData.labels
    : getTimeframeLabels();

  const datasets =
    trendData?.datasets?.length > 0 && selectedTimeframe === '6m'
      ? trendData.datasets
      : [
          {
            label: 'WBC (cells/cumm)',
            data: selectedTimeframe === '1m' ? [23500, 24000, 23800, 23300] : [22000, 24000, 25500, 25000, 24000, 23300],
            borderColor: '#7C3AED',
            backgroundColor: '#7C3AED',
          },
          {
            label: 'Hemoglobin (g/dL)',
            data: selectedTimeframe === '1m' ? [13100, 13200, 13200, 13200] : [13000, 13200, 13100, 13300, 13200, 13200],
            borderColor: '#0EA5E9',
            backgroundColor: '#0EA5E9',
          },
          {
            label: 'Neutrophils (%)',
            data: selectedTimeframe === '1m' ? [5600, 5700, 5800, 5800] : [5500, 5600, 5500, 5700, 5600, 5800],
            borderColor: '#EF4444',
            backgroundColor: '#EF4444',
          },
        ];

  const currentLabel = TIMEFRAMES.find((t) => t.id === selectedTimeframe)?.label || 'Last 6 Months';

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
        border: '1px solid #E2E8F0',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {/* Header with Timeframe Dropdown */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          position: 'relative',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
          Trends Over Time
        </h3>

        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC',
              fontSize: '12px',
              fontWeight: 600,
              color: colors.textPrimary,
              cursor: 'pointer',
            }}
          >
            <span>{currentLabel}</span>
            <ChevronDown size={14} />
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: 0,
                backgroundColor: '#FFFFFF',
                borderRadius: '10px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid #E2E8F0',
                zIndex: 50,
                width: '140px',
                padding: '4px 0',
              }}
            >
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => {
                    setSelectedTimeframe(tf.id);
                    setDropdownOpen(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: selectedTimeframe === tf.id ? 700 : 400,
                    color: selectedTimeframe === tf.id ? colors.primary : '#1E293B',
                    backgroundColor: selectedTimeframe === tf.id ? 'rgba(79, 70, 229, 0.06)' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Line Chart */}
      <div style={{ flex: 1, minHeight: '220px' }}>
        <LineTrendChart labels={labels} datasets={datasets} compact={false} />
      </div>
    </div>
  );
}
