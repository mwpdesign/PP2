import React, { createContext, useContext, ReactNode } from 'react';

interface ConfigContextType {
  apiUrl: string;
  environment: string;
  features: {
    enableAnalytics: boolean;
    enableNotifications: boolean;
  };
}

const defaultConfig: ConfigContextType = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  environment: process.env.NODE_ENV || 'development',
  features: {
    enableAnalytics: true,
    enableNotifications: true
  }
};

const ConfigContext = createContext<ConfigContextType>(defaultConfig);

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

interface ConfigProviderProps {
  children: ReactNode;
  config?: Partial<ConfigContextType>;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ 
  children,
  config = {}
}) => {
  const mergedConfig = {
    ...defaultConfig,
    ...config,
    features: {
      ...defaultConfig.features,
      ...(config.features || {})
    }
  };

  return (
    <ConfigContext.Provider value={mergedConfig}>
      {children}
    </ConfigContext.Provider>
  );
};

export default ConfigProvider; 