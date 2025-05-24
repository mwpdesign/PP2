import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';

const DashboardContent: React.FC = () => {
  const { user } = useAuth();

  const renderMetrics = () => {
    switch (user?.role) {
      case UserRole.Doctor:
        return [
          { title: "Active Patients", value: "1,234", subtitle: "Currently in system", icon: "👥" },
          { title: "Calls Today", value: "856", subtitle: "Last 24 hours", icon: "📞" },
          { title: "Success Rate", value: "98.5%", subtitle: "Call completion rate", icon: "📈" },
          { title: "Avg Response", value: "1.2m", subtitle: "Response time", icon: "⚡" }
        ];
      case UserRole.Admin:
        return [
          { title: "Active Users", value: "2,456", subtitle: "Across all roles", icon: "👥" },
          { title: "System Health", value: "99.9%", subtitle: "Uptime this month", icon: "🔋" },
          { title: "Compliance Score", value: "98%", subtitle: "HIPAA metrics", icon: "✅" },
          { title: "Active Sessions", value: "847", subtitle: "Current users", icon: "🔐" }
        ];
      case UserRole.IVRCompany:
        return [
          { title: "Active Calls", value: "156", subtitle: "Currently in queue", icon: "📞" },
          { title: "Avg Wait Time", value: "2.3m", subtitle: "Current queue", icon: "⏱️" },
          { title: "Resolution Rate", value: "95%", subtitle: "Today's calls", icon: "✅" },
          { title: "Escalations", value: "12", subtitle: "Pending review", icon: "⚠️" }
        ];
      case UserRole.Logistics:
        return [
          { title: "Pending Orders", value: "89", subtitle: "To be shipped", icon: "📦" },
          { title: "In Transit", value: "234", subtitle: "Active deliveries", icon: "🚚" },
          { title: "Delivered Today", value: "156", subtitle: "Completed", icon: "✅" },
          { title: "Inventory Items", value: "1.2k", subtitle: "In stock", icon: "📋" }
        ];
      default:
        return [];
    }
  };

  const renderActivities = () => {
    switch (user?.role) {
      case UserRole.Doctor:
        return [
          { title: "New patient registration", time: "2 minutes ago", status: "Completed", icon: "👤" },
          { title: "IVR Call - John Smith", time: "15 minutes ago", status: "In Progress", icon: "📞" },
          { title: "Prescription renewal", time: "1 hour ago", status: "Pending", icon: "💊" },
          { title: "Lab results uploaded", time: "2 hours ago", status: "Completed", icon: "🔬" }
        ];
      case UserRole.Admin:
        return [
          { title: "New user registration", time: "5 minutes ago", status: "Completed", icon: "👤" },
          { title: "System backup", time: "1 hour ago", status: "Completed", icon: "💾" },
          { title: "Security audit", time: "2 hours ago", status: "In Progress", icon: "🔒" },
          { title: "Compliance check", time: "3 hours ago", status: "Completed", icon: "📋" }
        ];
      case UserRole.IVRCompany:
        return [
          { title: "Patient Verification", time: "2 minutes ago", status: "In Progress", icon: "🔍" },
          { title: "Prescription Renewal", time: "15 minutes ago", status: "Completed", icon: "💊" },
          { title: "Emergency Contact", time: "1 hour ago", status: "Escalated", icon: "🚨" },
          { title: "Insurance Check", time: "2 hours ago", status: "Completed", icon: "📋" }
        ];
      case UserRole.Logistics:
        return [
          { title: "Medical Supplies", time: "10 minutes ago", status: "Shipped", icon: "📦" },
          { title: "Lab Equipment", time: "1 hour ago", status: "In Transit", icon: "🔬" },
          { title: "Prescription Delivery", time: "2 hours ago", status: "Delivered", icon: "💊" },
          { title: "Emergency Kit", time: "3 hours ago", status: "Processing", icon: "🚑" }
        ];
      default:
        return [];
    }
  };

  return (
    <>
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome back, {user?.email?.split('@')[0]}
            </h2>
            <p className="text-gray-600">Here's what's happening in your practice today</p>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90">
              New Request
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {renderMetrics().map((metric, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-brand-primary bg-opacity-10 rounded-lg">
                <span className="text-brand-primary text-xl">{metric.icon}</span>
              </div>
            </div>
            <h3 className="text-gray-700 font-medium mb-2">{metric.title}</h3>
            <p className="text-3xl font-bold text-brand-primary mb-1">{metric.value}</p>
            <p className="text-gray-500 text-sm">{metric.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-2">
          {renderActivities().map((activity, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="p-2 bg-brand-primary bg-opacity-10 rounded-lg">
                <span className="text-brand-primary">{activity.icon}</span>
              </div>
              <div className="flex-1">
                <p className="text-gray-800 font-medium">{activity.title}</p>
                <p className="text-gray-500 text-sm">{activity.time}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm ${
                activity.status === 'Completed' ? 'bg-green-100 text-green-800' :
                activity.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                activity.status === 'Escalated' ? 'bg-red-100 text-red-800' :
                activity.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                activity.status === 'In Transit' ? 'bg-yellow-100 text-yellow-800' :
                activity.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {activity.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default DashboardContent; 