export interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  avgProcessingTime: string;
  complianceScore: string;
  performanceData: PerformanceData[];
  errorRate: string;
  uptime: string;
}

export interface SystemHealth {
  status: 'optimal' | 'good' | 'warning' | 'critical';
  uptime: string;
  apiResponseTime: string;
  dbLoad: string;
  activeSessions: string;
  errorRate: string;
  lastChecked: string;
  components: {
    api: ComponentHealth;
    database: ComponentHealth;
    cache: ComponentHealth;
    queue: ComponentHealth;
  };
}

export interface ComponentHealth {
  status: 'optimal' | 'good' | 'warning' | 'critical';
  metrics: {
    [key: string]: string | number;
  };
  lastChecked: string;
}

export interface UserActivity {
  id: string;
  user: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  };
  action: string;
  resource: string;
  timestamp: string;
  details?: {
    [key: string]: any;
  };
}

export interface PerformanceData {
  time: string;
  value: number;
  category?: string;
}

export interface GeographicData {
  region: string;
  users: number;
  requests: number;
  performance: number;
}

export type TimeFrame = '1h' | '24h' | '7d' | '30d' | '90d'; 