import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, BarChart3, FileText, Building2, Settings, Activity, 
  Bell, Server, Database, Clock, TrendingUp, AlertTriangle, Globe,
  CheckCircle, XCircle, RefreshCw, Download, Filter
} from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import Card from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/shared/layout/DashboardLayout";
import SystemHeader from "@/components/shared/layout/SystemHeader";
import { NotificationCenter } from "@/components/shared/NotificationCenter";
import { AdminMetricsCard } from "@/components/admin/AdminMetricsCard";
import { SystemHealthChart } from "@/components/admin/SystemHealthChart";
import { RecentActivityFeed } from "@/components/admin/RecentActivityFeed";
import { AdminQuickActions } from "@/components/admin/AdminQuickActions";
import { formatNumber, formatDate } from "@/utils/format";
import { systemService } from "@/services/systemService";

const AdminDashboard = () => {
  console.log("🔄 DEBUG: Updated Dashboard Component Loading - " + new Date().toISOString());

  const { user } = useAuth();
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Real-time system metrics
  const { data: systemMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: systemService.getSystemMetrics,
    refetchInterval: refreshInterval
  });

  // System health status
  const { data: healthStatus, isLoading: healthLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: systemService.getSystemHealth,
    refetchInterval: refreshInterval
  });

  // User activity data
  const { data: userActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['user-activity'],
    queryFn: systemService.getUserActivity
  });

  const metrics = [
    {
      title: "Total Users",
      value: formatNumber(systemMetrics?.totalUsers || 0),
      change: "+12.5%",
      trend: "up",
      icon: <Users className="h-6 w-6 text-slate-600" />,
      details: [
        { label: "Active Today", value: "1,247" },
        { label: "Growth Rate", value: "12.5%" }
      ]
    },
    {
      title: "System Health",
      value: healthStatus?.uptime || "99.9%",
      change: "Optimal",
      trend: "stable",
      icon: <Shield className="h-6 w-6 text-emerald-600" />,
      details: [
        { label: "Response Time", value: "45ms" },
        { label: "Error Rate", value: "0.01%" }
      ]
    },
    {
      title: "IVR Performance",
      value: systemMetrics?.avgProcessingTime || "1.2s",
      change: "-15%",
      trend: "improving",
      icon: <Activity className="h-6 w-6 text-blue-600" />,
      details: [
        { label: "Success Rate", value: "99.8%" },
        { label: "Avg Wait Time", value: "0.8s" }
      ]
    },
    {
      title: "Compliance Score",
      value: systemMetrics?.complianceScore || "98%",
      change: "+2.1%",
      trend: "up",
      icon: <FileText className="h-6 w-6 text-slate-600" />,
      details: [
        { label: "HIPAA Status", value: "Compliant" },
        { label: "Last Audit", value: "2d ago" }
      ]
    }
  ];

  const systemHealthIndicators = [
    {
      title: "API Response Time",
      value: healthStatus?.apiResponseTime || "45ms",
      status: "optimal",
      icon: <Server className="h-5 w-5" />
    },
    {
      title: "Database Load",
      value: healthStatus?.dbLoad || "32%",
      status: "good",
      icon: <Database className="h-5 w-5" />
    },
    {
      title: "Active Sessions",
      value: healthStatus?.activeSessions || "1,247",
      status: "optimal",
      icon: <Users className="h-5 w-5" />
    },
    {
      title: "Error Rate",
      value: healthStatus?.errorRate || "0.01%",
      status: "optimal",
      icon: <AlertTriangle className="h-5 w-5" />
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-emerald-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-amber-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-red-100">
        <SystemHeader 
          title="🔄 DEBUG: UPDATED Admin Command Center"
          subtitle={`DEBUG TEST - Welcome back, ${user ? `${user.firstName} ${user.lastName}` : 'Admin'}`}
          icon={<Settings className="h-6 w-6" />}
        >
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setRefreshInterval(prev => prev ? 0 : 30000)}
              className="flex items-center px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshInterval ? 'animate-spin' : ''}`} />
              {refreshInterval ? 'Auto-refresh On' : 'Auto-refresh Off'}
            </button>
            <button className="flex items-center px-3 py-1.5 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </button>
          </div>
        </SystemHeader>
        
        <main className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
          <h1 className="text-3xl font-bold text-red-500">DEBUG: Component Updated!</h1>
          
          {/* System Health Status Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-slate-600" />
                System Health Status
              </h2>
              <span className="text-sm text-gray-500">
                Last updated: {formatDate(new Date().toISOString())}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {systemHealthIndicators.map((indicator, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${getStatusColor(indicator.status)} bg-opacity-10`}>
                      {indicator.icon}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">{indicator.title}</p>
                      <p className={`text-lg font-semibold ${getStatusColor(indicator.status)}`}>
                        {indicator.value}
                      </p>
                    </div>
                  </div>
                  {indicator.status === 'optimal' && (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, index) => (
              <Card key={index} className="relative overflow-hidden group">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-gray-50">
                      {metric.icon}
                    </div>
                    <span className={`text-sm font-medium ${
                      metric.trend === 'up' ? 'text-emerald-600' : 
                      metric.trend === 'down' ? 'text-red-600' : 
                      'text-blue-600'
                    }`}>
                      {metric.change}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">{metric.title}</h3>
                  <p className="text-2xl font-semibold text-gray-900 mb-2">
                    {metric.value}
                  </p>
                  <div className="space-y-1">
                    {metric.details.map((detail, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{detail.label}</span>
                        <span className="font-medium text-gray-900">{detail.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-500 to-slate-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              </Card>
            ))}
          </div>

          {/* Analytics and Activity Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* System Performance Chart */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-slate-600" />
                  System Performance
                </h3>
                <select className="text-sm border-gray-300 rounded-md focus:ring-slate-500 focus:border-slate-500">
                  <option>Last 24 Hours</option>
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={systemMetrics?.performanceData || []}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="time" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#475569"
                      fill="#F1F5F9"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-slate-600" />
                  Recent Activity
                </h3>
                <button className="text-sm text-slate-600 hover:text-slate-800">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                <RecentActivityFeed />
              </div>
            </Card>
          </div>

          {/* Quick Actions and Notifications */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-slate-600" />
                  Geographic Distribution
                </h3>
                <div className="h-80">
                  {/* Add Geographic Distribution Chart Here */}
                </div>
              </Card>
            </div>
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Bell className="h-5 w-5 mr-2 text-slate-600" />
                System Notifications
              </h3>
              <NotificationCenter open={true} onClose={() => {}} userRole="Admin" />
            </Card>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard; 