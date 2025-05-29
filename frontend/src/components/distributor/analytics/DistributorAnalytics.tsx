import React, { useState } from 'react';
import { Card } from '../../shared/ui/Card';
import { ChartCard } from '../../shared/DashboardWidgets/ChartCard';

// Mock data for order trends
const orderTrendData = [
  { month: 'Jan', orders: 1240, approved: 1180, shipped: 1150 },
  { month: 'Feb', orders: 1380, approved: 1320, shipped: 1295 },
  { month: 'Mar', orders: 1520, approved: 1480, shipped: 1460 },
  { month: 'Apr', orders: 1690, approved: 1630, shipped: 1610 },
  { month: 'May', orders: 1850, approved: 1790, shipped: 1775 },
  { month: 'Jun', orders: 2120, approved: 2050, shipped: 2030 },
];

// Mock data for IVR approval trends
const ivrApprovalData = [
  { week: 'Week 1', submitted: 285, approved: 270, pending: 15 },
  { week: 'Week 2', submitted: 310, approved: 295, pending: 15 },
  { week: 'Week 3', submitted: 295, approved: 285, pending: 10 },
  { week: 'Week 4', submitted: 320, approved: 305, pending: 15 },
];

// Mock data for shipping performance
const shippingPerformanceData = [
  { carrier: 'UPS', avgDays: 2.1, onTime: 98.5, total: 1250 },
  { carrier: 'FedEx', avgDays: 2.3, onTime: 97.2, total: 980 },
  { carrier: 'USPS', avgDays: 3.2, onTime: 94.8, total: 650 },
  { carrier: 'DHL', avgDays: 2.8, onTime: 96.1, total: 320 },
];

// Mock network growth data
const networkGrowthData = [
  { month: 'Jan', distributors: 15, salespeople: 45, doctors: 180 },
  { month: 'Feb', distributors: 16, salespeople: 48, doctors: 185 },
  { month: 'Mar', distributors: 17, salespeople: 52, doctors: 192 },
  { month: 'Apr', distributors: 18, salespeople: 55, doctors: 198 },
  { month: 'May', distributors: 19, salespeople: 58, doctors: 205 },
  { month: 'Jun', distributors: 20, salespeople: 62, doctors: 215 },
];

const DistributorAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Analytics & Reports</h1>
          <p className="text-gray-500 mt-1">Master distributor performance metrics and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-[#375788] focus:border-[#375788]"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">2,847</p>
              <p className="text-xs text-green-600">↑ 12.5% vs last month</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-50 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">IVR Approval Rate</p>
              <p className="text-2xl font-semibold text-gray-900">96.2%</p>
              <p className="text-xs text-green-600">↑ 2.1% vs last month</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-50 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Shipping Time</p>
              <p className="text-2xl font-semibold text-gray-900">2.1d</p>
              <p className="text-xs text-green-600">↓ 0.3d vs last month</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-50 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Network Users</p>
              <p className="text-2xl font-semibold text-gray-900">297</p>
              <p className="text-xs text-green-600">↑ 8.3% vs last month</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Trends */}
        <Card className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-slate-900">Order Processing Trends</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="h-3 w-3 bg-[#375788] rounded-full mr-2" />
                <span className="text-sm text-gray-600">Orders</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 bg-[#10B981] rounded-full mr-2" />
                <span className="text-sm text-gray-600">Shipped</span>
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ChartCard
              title=""
              type="line"
              data={orderTrendData}
              dataKey="orders"
              secondaryDataKey="shipped"
              xAxisDataKey="month"
              color="#375788"
              secondaryColor="#10B981"
              height={280}
            />
          </div>
        </Card>

        {/* IVR Approval Trends */}
        <Card className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-slate-900">IVR Approval Trends</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="h-3 w-3 bg-[#375788] rounded-full mr-2" />
                <span className="text-sm text-gray-600">Submitted</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 bg-[#10B981] rounded-full mr-2" />
                <span className="text-sm text-gray-600">Approved</span>
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ChartCard
              title=""
              type="bar"
              data={ivrApprovalData}
              dataKey="submitted"
              secondaryDataKey="approved"
              xAxisDataKey="week"
              color="#375788"
              secondaryColor="#10B981"
              height={280}
            />
          </div>
        </Card>
      </div>

      {/* Network Growth and Shipping Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Network Growth */}
        <Card className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-slate-900 mb-6">Network Growth</h3>
          <div className="h-[300px]">
            <ChartCard
              title=""
              type="area"
              data={networkGrowthData}
              dataKey="doctors"
              secondaryDataKey="distributors"
              xAxisDataKey="month"
              color="#375788"
              secondaryColor="#10B981"
              height={280}
            />
          </div>
          <div className="flex items-center justify-center space-x-6 mt-4">
            <div className="flex items-center">
              <div className="h-3 w-3 bg-[#375788] rounded-full mr-2" />
              <span className="text-sm text-gray-600">Doctors</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 bg-[#10B981] rounded-full mr-2" />
              <span className="text-sm text-gray-600">Distributors</span>
            </div>
          </div>
        </Card>

        {/* Shipping Performance */}
        <Card className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-slate-900">Shipping Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Carrier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Avg. Days</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">On-Time %</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Volume</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shippingPerformanceData.map((carrier) => (
                  <tr key={carrier.carrier}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{carrier.carrier}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{carrier.avgDays}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        carrier.onTime >= 98 ? 'bg-green-100 text-green-800' :
                        carrier.onTime >= 95 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {carrier.onTime}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{carrier.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Network Summary */}
      <Card className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-slate-900 mb-6">Network Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#375788] mb-2">20</div>
            <div className="text-sm text-gray-500">Active Distributors</div>
            <div className="text-xs text-green-600 mt-1">↑ 2 new this month</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#375788] mb-2">62</div>
            <div className="text-sm text-gray-500">Sales Representatives</div>
            <div className="text-xs text-green-600 mt-1">↑ 5 new this month</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#375788] mb-2">215</div>
            <div className="text-sm text-gray-500">Healthcare Providers</div>
            <div className="text-xs text-green-600 mt-1">↑ 12 new this month</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DistributorAnalytics; 