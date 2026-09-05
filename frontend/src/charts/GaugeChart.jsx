import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement } from 'chart.js';
import { colors } from '../theme/colors';

ChartJS.register(ArcElement);

const getSegmentColor = (value) => {
  if (value >= 80) return colors.success;
  if (value >= 60) return colors.warning;
  if (value >= 40) return colors.warning;
  return colors.danger;
};

const centerTextPlugin = {
  id: 'gaugeCenter',
  beforeDraw(chart) {
    const { ctx, width, height } = chart;
    const meta = chart.getDatasetMeta(0);
    if (!meta || !meta.data || !meta.data[0]) return;

    const label = chart.config.options?.plugins?.gaugeCenter?.label;
    if (!label) return;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Main score
    ctx.font = '700 28px Poppins, sans-serif';
    ctx.fillStyle = colors.textPrimary;
    ctx.fillText(label, width / 2, height * 0.58);

    ctx.restore();
  },
};

export default function GaugeChart({ value = 0, label }) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const segmentColor = getSegmentColor(clampedValue);
  const displayLabel = label || `${Math.round(clampedValue)}/100`;

  const data = {
    datasets: [
      {
        data: [clampedValue, 100 - clampedValue],
        backgroundColor: [segmentColor, '#E2E8F0'],
        borderWidth: 0,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    rotation: -90,
    circumference: 180,
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
      gaugeCenter: { label: displayLabel },
    },
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '220px', margin: '0 auto' }}>
      <Doughnut data={data} options={options} plugins={[centerTextPlugin]} />
    </div>
  );
}
