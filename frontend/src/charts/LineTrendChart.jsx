import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  Filler,
} from 'chart.js';
import { colors } from '../theme/colors';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Legend, Tooltip, Filler);

const DATASET_COLORS = [colors.primary, colors.secondary, colors.accent];

export default function LineTrendChart({ labels = [], datasets = [], compact = false }) {
  const chartDatasets = datasets.map((ds, index) => {
    const color = DATASET_COLORS[index % DATASET_COLORS.length];
    return {
      label: ds.label,
      data: ds.data,
      borderColor: color,
      backgroundColor: color + '1A',
      borderWidth: compact ? 2 : 2.5,
      pointRadius: compact ? 0 : 4,
      pointHoverRadius: compact ? 0 : 6,
      pointBackgroundColor: color,
      pointBorderColor: '#FFFFFF',
      pointBorderWidth: 2,
      tension: 0.35,
      fill: !compact,
      spanGaps: true,
    };
  });

  const data = { labels, datasets: chartDatasets };

  const options = {
    responsive: true,
    maintainAspectRatio: compact ? true : false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: !compact,
        position: 'bottom',
        labels: {
          font: { family: 'Poppins, sans-serif', size: 12, weight: '500' },
          color: colors.textSecondary,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
        },
      },
      tooltip: {
        enabled: !compact,
        backgroundColor: colors.darkBackground,
        titleFont: { family: 'Poppins, sans-serif', size: 13, weight: '600' },
        bodyFont: { family: 'Poppins, sans-serif', size: 12 },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 4,
      },
    },
    scales: {
      x: {
        display: !compact,
        grid: { display: false },
        ticks: {
          font: { family: 'Poppins, sans-serif', size: 12 },
          color: colors.textSecondary,
        },
      },
      y: {
        display: !compact,
        grid: {
          color: 'rgba(0, 0, 0, 0.04)',
          drawBorder: false,
        },
        ticks: {
          font: { family: 'Poppins, sans-serif', size: 12 },
          color: colors.textSecondary,
          padding: 8,
        },
      },
    },
  };

  return (
    <div style={{ width: '100%', height: compact ? '60px' : '280px' }}>
      <Line data={data} options={options} />
    </div>
  );
}
