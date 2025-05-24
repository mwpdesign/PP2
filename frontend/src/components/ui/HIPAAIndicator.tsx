import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { Shield, Lock, InfoOutlined } from '@mui/icons-material';

interface HIPAAIndicatorProps {
  type: 'section' | 'field' | 'form';
  message?: string;
  encrypted?: boolean;
}

export const HIPAAIndicator: React.FC<HIPAAIndicatorProps> = ({
  type,
  message,
  encrypted = true,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'section':
        return <Shield sx={{ fontSize: 16 }} />;
      case 'field':
        return <Lock sx={{ fontSize: 16 }} />;
      case 'form':
        return <InfoOutlined sx={{ fontSize: 16 }} />;
      default:
        return <Shield sx={{ fontSize: 16 }} />;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'section':
        return 'This section is HIPAA compliant';
      case 'field':
        return encrypted
          ? 'This field is encrypted and HIPAA compliant'
          : 'This field contains Protected Health Information (PHI)';
      case 'form':
        return 'This form handles Protected Health Information (PHI)';
      default:
        return 'HIPAA compliant';
    }
  };

  return (
    <Tooltip title={message || getDefaultMessage()}>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          py: 0.5,
          borderRadius: 1,
          bgcolor: 'rgba(46, 134, 171, 0.08)',
          color: 'primary.main',
          border: '1px solid',
          borderColor: 'rgba(46, 134, 171, 0.2)',
        }}
      >
        {getIcon()}
        <Typography
          variant="caption"
          component="span"
          sx={{
            fontWeight: 500,
            display: { xs: 'none', sm: 'inline' },
          }}
        >
          HIPAA
        </Typography>
      </Box>
    </Tooltip>
  );
}; 