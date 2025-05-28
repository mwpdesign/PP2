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

// Set default font family and colors
ChartJS.defaults.font.family = "'Inter', 'system-ui', '-apple-system', sans-serif";
ChartJS.defaults.color = '#6B7280';

// Configure default tooltips
const tooltipDefaults: TooltipOptions<keyof ChartTypeRegistry> = {
  enabled: true,
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  titleColor: '#111827',
  bodyColor: '#4B5563',
  borderColor: '#E5E7EB',
  borderWidth: 1,
  padding: 12,
  boxPadding: 4,
  usePointStyle: true,
  bodyFont: {
    size: 13
  },
  titleFont: {
    size: 14,
    weight: 600
  }
};

ChartJS.defaults.plugins.tooltip = tooltipDefaults;

// Configure default legend
const legendDefaults: LegendOptions<keyof ChartTypeRegistry> = {
  display: true,
  position: 'top',
  labels: {
    padding: 16,
    usePointStyle: true,
    pointStyle: 'circle',
    boxWidth: 6,
    boxHeight: 6,
    color: '#6B7280',
    font: {
      size: 12
    }
  }
};

ChartJS.defaults.plugins.legend = legendDefaults;

// Export the configured Chart instance
export { ChartJS };

// Global chart options
export const defaultOptions: ChartOptions<keyof ChartTypeRegistry> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: '#F3F4F6',
        borderWidth: 0
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