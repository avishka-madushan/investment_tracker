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
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function PriceChart({
  dates = [],
  close = [],
  sma4 = [],
  sma9 = [],
  sma50 = [],
}) {
  if (!dates || dates.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-white/40 text-sm">
        No price history chart data available.
      </div>
    );
  }

  const data = {
    labels: dates,
    datasets: [
      {
        label: 'Close Price',
        data: close,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        backgroundColor: 'transparent',
        tension: 0.1,
        borderWidth: 2,
        pointRadius: 0,
      },
      {
        label: 'SMA 4',
        data: sma4,
        borderColor: 'rgba(52, 211, 153, 0.8)',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.1,
        borderWidth: 1.5,
        pointRadius: 0,
      },
      {
        label: 'SMA 9',
        data: sma9,
        borderColor: 'rgba(56, 189, 248, 0.8)',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.1,
        borderWidth: 1.5,
        pointRadius: 0,
      },
      {
        label: 'SMA 50',
        data: sma50,
        borderColor: 'rgba(248, 113, 113, 0.8)',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.1,
        borderWidth: 1.5,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: 'rgba(255,255,255,0.7)', boxWidth: 12, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: 'rgba(20, 20, 25, 0.9)',
        titleColor: 'rgba(255,255,255,0.6)',
        bodyColor: '#fff',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: 'rgba(255,255,255,0.5)', maxTicksLimit: 10 },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: {
          color: 'rgba(255,255,255,0.5)',
          callback: (value) => '$' + value,
        },
      },
    },
  };

  return (
    <div className="h-80 w-full">
      <Line data={data} options={options} />
    </div>
  );
}
