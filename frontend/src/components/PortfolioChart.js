'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function PortfolioChart({ dates = [], values = [] }) {
  if (!dates || dates.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-white/40 text-sm">
        No performance history data available.
      </div>
    );
  }

  const data = {
    labels: dates,
    datasets: [
      {
        label: 'Portfolio Value ($)',
        data: values,
        borderColor: '#818cf8',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
          return gradient;
        },
        borderWidth: 3,
        pointBackgroundColor: '#0a0a0f',
        pointBorderColor: '#818cf8',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(20, 20, 25, 0.9)',
        titleColor: 'rgba(255,255,255,0.6)',
        bodyColor: '#fff',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: { color: 'rgba(255, 255, 255, 0.5)', maxTicksLimit: 7 },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          callback: (value) => '$' + value,
        },
      },
    },
  };

  return (
    <div className="h-72 w-full">
      <Line data={data} options={options} />
    </div>
  );
}
