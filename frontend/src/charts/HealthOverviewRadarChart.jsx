import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { colors } from '../theme/colors';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function HealthOverviewRadarChart({ testValues = [], profileName = 'Patient' }) {
  // Select top 6-8 parameters for radar visualization
  const displayItems = testValues.slice(0, 7);

  const labels = displayItems.map((item) => {
    const valStr = item.value != null ? `${item.value} ${item.unit || ''}`.trim() : '';
    return `${item.test_name}\n${valStr}`;
  });

  // Calculate normalized values (0 to 100) for radar geometry
  const patientData = displayItems.map((item) => {
    if (item.value == null) return 50;
    if (item.ref_low != null && item.ref_high != null && item.ref_high > item.ref_low) {
      const span = item.ref_high - item.ref_low;
      const norm = ((item.value - item.ref_low) / span) * 40 + 50;
      return Math.max(15, Math.min(100, norm));
    }
    return 50;
  });

  const normalRangeData = displayItems.map(() => 50);

  const chartData = {
    labels: displayItems.map((item) => item.test_name),
    datasets: [
      {
        label: `${profileName}'s Result`,
        data: patientData,
        backgroundColor: 'rgba(124, 58, 237, 0.15)',
        borderColor: '#7C3AED',
        borderWidth: 2,
        pointBackgroundColor: displayItems.map((item) =>
          item.status === 'red' || item.status === 'yellow' ? '#EF4444' : '#10B981'
        ),
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Normal Range',
        data: normalRangeData,
        backgroundColor: 'transparent',
        borderColor: '#10B981',
        borderWidth: 1.5,
        borderDash: [5, 5],
        pointRadius: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: '#E2E8F0' },
        grid: { color: '#F1F5F9' },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: { display: false },
        pointLabels: {
          font: {
            family: 'Poppins, sans-serif',
            size: 11,
            weight: '600',
          },
          color: (context) => {
            const idx = context.index;
            const item = displayItems[idx];
            if (item?.status === 'red' || item?.status === 'yellow') return '#EF4444';
            return '#10B981';
          },
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const idx = context.dataIndex;
            const item = displayItems[idx];
            if (!item) return '';
            const statusText = item.status ? `(${item.status.toUpperCase()})` : '';
            return `${item.test_name}: ${item.value ?? '—'} ${item.unit || ''} ${statusText}`;
          },
        },
      },
    },
  };

  return (
    <div style={{ width: '100%', height: '280px', position: 'relative' }}>
      <Radar data={chartData} options={chartOptions} />

      {/* Legend Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          marginTop: '12px',
          fontSize: '12px',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#7C3AED',
              display: 'inline-block',
            }}
          />
          <span style={{ fontWeight: 600, color: colors.textPrimary }}>
            {profileName}'s Result
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '16px',
              height: '2px',
              borderTop: '2px dashed #10B981',
              display: 'inline-block',
            }}
          />
          <span style={{ fontWeight: 500, color: colors.textSecondary }}>
            Normal Range
          </span>
        </div>
      </div>
    </div>
  );
}
