 
// ============================================
// FILE 1/15: config.js
// Location: SafelyHome/config.js
// ============================================

// IMPORTANT: Replace YOUR_IP_ADDRESS with your actual computer's IP
// Find it with:
// Windows: ipconfig (look for IPv4 Address)
// Mac/Linux: ifconfig | grep "inet " (look for 192.168.x.x)

// Example: If your IP is 192.168.18.17, it should be:
// export const API_URL = 'http://192.168.18.17:5000/api';

export const API_URL = 'http://192.168.18.16:5000/api';
export const SOCKET_URL = 'http://192.168.18.16:5000';

// Google Maps API Key (Optional - only if you want maps)
// Get from: https://console.cloud.google.com/
// Leave empty if not using maps
export const GOOGLE_MAPS_API_KEY = 'AIzaSyCzsOcj0ZcFzNfyqLskuOQQC2ttgB_0Pyk';

// App Colors - From your design
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