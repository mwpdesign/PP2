import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  TooltipOptions,
  LegendOptions,
  ChartTypeRegistry,
} from 'chart.js';

// Destroy any existing chart instances before registering new ones
Object.keys(ChartJS.instances || {}).forEach((key) => {
  const instance = ChartJS.instances[key];
  if (instance) {
    instance.destroy();
  }
});

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

// Configure defaults
ChartJS.defaults.responsive = true;
ChartJS.defaults.maintainAspectRatio = false;
ChartJS.defaults.font.family = "'Inter', 'system-ui', '-apple-system', sans-serif";
ChartJS.defaults.color = '#6B7280';

// Export the configured Chart instance
export { ChartJS };

// Global chart options
export const defaultOptions: ChartOptions<keyof ChartTypeRegistry> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    tooltip: {
      enabled: true,
      mode: 'index' as const,
      intersect: false,
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: '#F3F4F6',
        display: true
      },
      ticks: {
        padding: 8
      }
    },
    x: {
      grid: {
        display: false
      },
      ticks: {
        padding: 8
      }
    }
  }
};

// Chart colors
export const chartColors = {
  blue: {
    primary: 'rgb(59, 130, 246)',
    light: 'rgba(59, 130, 246, 0.5)',
  },
  green: {
    primary: 'rgb(16, 185, 129)',
    light: 'rgba(16, 185, 129, 0.5)',
  },
  purple: {
    primary: 'rgb(139, 92, 246)',
    light: 'rgba(139, 92, 246, 0.5)',
  },
  yellow: {
    primary: 'rgb(245, 158, 11)',
    light: 'rgba(245, 158, 11, 0.5)',
  },
  red: {
    primary: 'rgb(239, 68, 68)',
    light: 'rgba(239, 68, 68, 0.5)',
  },
}; 