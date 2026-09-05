import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Legend, Tooltip } from 'chart.js';
import { colors } from '../theme/colors';

ChartJS.register(ArcElement, Legend, Tooltip);

export default function RatioDoughnutChart({ normal = 0, borderline = 0, abnormal = 0 }) {
  const total = normal + borderline + abnormal;

  if (total === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '200px',
          color: colors.textSecondary,
          fontSize: '14px',
          fontFamily: 'Poppins, sans-serif',
          fontStyle: 'italic',
        }}
      >
        No scored values
      </div>
    );
  }

  const data = {
    labels: ['Normal', 'Borderline', 'Abnormal'],
    datasets: [
      {
        data: [normal, borderline, abnormal],
        backgroundColor: [
          colors.success + 'CC',
          colors.warning + 'CC',
          colors.danger + 'CC',
        ],
        borderColor: [colors.success, colors.warning, colors.danger],
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '55%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          font: { family: 'Poppins, sans-serif', size: 12, weight: '500' },
          color: colors.textSecondary,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: colors.darkBackground,
        titleFont: { family: 'Poppins, sans-serif', size: 13, weight: '600' },
        bodyFont: { family: 'Poppins, sans-serif', size: 12 },
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          label: (ctx) => {
            const pct = total > 0 ? Math.round((ctx.raw / total) * 100) : 0;
            return ` ${ctx.label}: ${ctx.raw} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div style={{ width: '100%', height: '220px' }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}
