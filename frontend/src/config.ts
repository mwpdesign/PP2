interface Config {
  API_BASE_URL: string;
  WS_URL: string;
}

const config: Config = {
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',
  WS_URL: process.env.REACT_APP_WS_URL || 'ws://localhost:8000',
};

export default config; 