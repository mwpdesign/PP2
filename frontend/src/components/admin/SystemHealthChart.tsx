import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Box, Typography } from '@mui/material';

// Mock data - replace with real data from your API
const data = [
  { time: '00:00', cpu: 45, memory: 62, latency: 89 },
  { time: '04:00', cpu: 52, memory: 58, latency: 92 },
  { time: '08:00', cpu: 68, memory: 73, latency: 87 },
  { time: '12:00', cpu: 72, memory: 79, latency: 95 },
  { time: '16:00', cpu: 58, memory: 65, latency: 91 },
  { time: '20:00', cpu: 48, memory: 58, latency: 88 },
];

export const SystemHealthChart: React.FC = () => {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        System Health Metrics
      </Typography>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="cpu"
            name="CPU Usage (%)"
            stroke="#2E86AB"
            activeDot={{ r: 8 }}
          />
          <Line
            type="monotone"
            dataKey="memory"
            name="Memory Usage (%)"
            stroke="#F4A261"
            activeDot={{ r: 8 }}
          />
          <Line
            type="monotone"
            dataKey="latency"
            name="API Latency (ms)"
            stroke="#2A9D8F"
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Average CPU Usage
          </Typography>
          <Typography variant="h6">57.2%</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Average Memory Usage
          </Typography>
          <Typography variant="h6">65.8%</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Average Latency
          </Typography>
          <Typography variant="h6">90.3ms</Typography>
        </Box>
      </Box>
    </Box>
  );
}; 