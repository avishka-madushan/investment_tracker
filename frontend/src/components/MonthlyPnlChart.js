'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function MonthlyPnlChart({ months = [], pnlValues = [] }) {
  if (!months || months.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-white/40 text-sm">
        No monthly P/L data available.
      </div>
    );
  }

  const backgroundColors = pnlValues.map((val) =>
    val >= 0 ? 'rgba(52, 211, 153, 0.6)' : 'rgba(248, 113, 113, 0.6)'
  );
  const borderColors = pnlValues.map((val) =>
    val >= 0 ? 'rgba(52, 211, 153, 1)' : 'rgba(248, 113, 113, 1)'
  );

  const data = {
    labels: months,
    datasets: [
      {
        label: 'Realized P/L',
        data: pnlValues,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
        borderRadius: 6,
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
        grid: { display: false },
        ticks: { color: 'rgba(255, 255, 255, 0.5)' },
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
    <div className="h-44 w-full">
      <Bar data={data} options={options} />
    </div>
  );
}
