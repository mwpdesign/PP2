import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';
import { Users, FileText, Server, ShoppingCart } from 'lucide-react';

type IconType = 'users' | 'document' | 'server' | 'shopping-cart';

interface AdminMetricsCardProps {
  title: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  icon: IconType;
  suffix?: string;
}

const iconComponents: Record<IconType, React.FC<{ className?: string }>> = {
  'users': Users,
  'document': FileText,
  'server': Server,
  'shopping-cart': ShoppingCart,
};

const trendColors = {
  up: '#4CAF50',
  down: '#F44336',
  stable: '#9E9E9E',
};

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: TrendingFlat,
};

export const AdminMetricsCard: React.FC<AdminMetricsCardProps> = ({
  title,
  value,
  trend,
  icon,
  suffix = '',
}) => {
  const IconComponent = iconComponents[icon];
  const TrendIcon = trendIcons[trend];

  return (
    <Card sx={{ height: '100%', bgcolor: 'background.paper', boxShadow: 1 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 1,
              bgcolor: '#2E86AB',
              color: 'white',
              mr: 2,
            }}
          >
            <IconComponent className="w-5 h-5" />
          </Box>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
          <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
            {value}
            {suffix && (
              <Typography
                component="span"
                variant="h6"
                sx={{ ml: 0.5, color: 'text.secondary' }}
              >
                {suffix}
              </Typography>
            )}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mt: 1,
            color: trendColors[trend],
          }}
        >
          <TrendIcon sx={{ fontSize: 20, mr: 0.5 }} />
          <Typography variant="body2" component="span">
            {trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}; 