const isDevelopment = __DEV__;

// Replace with your Render URL
export const API_URL = isDevelopment 
  ? 'http://192.168.18.16:5000/api'  // Local development
  : 'https://your-app-name.onrender.com/api';  // Production Render URL

export const SOCKET_URL = isDevelopment
  ? 'http://192.168.18.16:5000'
  : 'https://your-app-name.onrender.com';

export const GOOGLE_MAPS_API_KEY = 'AIzaSyCzsOcj0ZcFzNfyqLskuOQQC2ttgB_0Pyk';

export const COLORS = {
  primary: '#312C51',
  secondary: '#48426D',
  accent: '#F0C38E',
  light: '#F1AA9B',
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#FFFFFF',
  textDark: '#312C51'
};