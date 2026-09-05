import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { colors } from '../theme/colors';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, annotationPlugin);

const STATUS_COLORS = {
  green: colors.success,
  yellow: colors.warning,
  red: colors.danger,
};

export default function BandedBarChart({ label, value, refLow, refHigh, unit, status }) {
  const barColor = STATUS_COLORS[status] || colors.textSecondary;
  const hasReference = refLow != null && refHigh != null;

  const yMax = hasReference
    ? Math.max(value, refHigh) * 1.3
    : value * 1.5;

  const data = {
    labels: [label],
    datasets: [
      {
        data: [value],
        backgroundColor: barColor + 'CC',
        borderColor: barColor,
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.5,
      },
    ],
  };

  const annotations = hasReference
    ? {
        refBand: {
          type: 'box',
          yMin: refLow,
          yMax: refHigh,
          backgroundColor: 'rgba(34, 197, 94, 0.08)',
          borderColor: 'rgba(34, 197, 94, 0.2)',
          borderWidth: 1,
          borderDash: [4, 4],
          label: {
            display: true,
            content: 'Normal Range',
            position: 'start',
            font: { family: 'Poppins, sans-serif', size: 10, weight: '500' },
            color: colors.success,
            padding: 4,
          },
        },
      }
    : {};

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'x',
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: colors.darkBackground,
        titleFont: { family: 'Poppins, sans-serif', size: 13, weight: '600' },
        bodyFont: { family: 'Poppins, sans-serif', size: 12 },
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          label: (ctx) => `${ctx.raw} ${unit || ''}`.trim(),
        },
      },
      annotation: { annotations },
    },
    scales: {
      x: {
        display: true,
        grid: { display: false },
        ticks: {
          font: { family: 'Poppins, sans-serif', size: 12, weight: '500' },
          color: colors.textPrimary,
        },
      },
      y: {
        display: true,
        min: 0,
        max: yMax,
        grid: {
          color: 'rgba(0, 0, 0, 0.04)',
          drawBorder: false,
        },
        ticks: {
          font: { family: 'Poppins, sans-serif', size: 11 },
          color: colors.textSecondary,
          padding: 6,
        },
      },
    },
  };

  return (
    <div style={{ width: '100%', height: '180px', position: 'relative' }}>
      <Bar data={data} options={options} />
      {!hasReference && (
        <p
          style={{
            position: 'absolute',
            bottom: '4px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '11px',
            color: colors.textSecondary,
            fontFamily: 'Poppins, sans-serif',
            fontStyle: 'italic',
            margin: 0,
            whiteSpace: 'nowrap',
          }}
        >
          Reference range unavailable
        </p>
      )}
    </div>
  );
}
