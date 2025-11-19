import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

export const login = async (email, password) => {
  const response = await api.post('/login', { email, password });
  if (response.data.token) {
    await AsyncStorage.setItem('token', response.data.token);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const register = async (userData, userType) => {
  const formData = new FormData();
  Object.keys(userData).forEach(key => {
    if (key === 'vehicleInfo' && userData[key]) {
      formData.append(key, JSON.stringify(userData[key]));
    } else if (key === 'faceImage' && userData[key]) {
      formData.append('faceImage', {
        uri: userData[key],
        type: 'image/jpeg',
        name: 'face.jpg',
      });
    } else if (userData[key]) {
      formData.append(key, userData[key]);
    }
  });
  formData.append('userType', userType);

  const response = await api.post('/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  
  if (response.data.token) {
    await AsyncStorage.setItem('token', response.data.token);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const setGenderPreference = async (preference) => {
  return (await api.post('/gender-preference', { genderPreference: preference })).data;
};

export const updateLocation = async (latitude, longitude) => {
  return (await api.post('/location', { latitude, longitude })).data;
};

export const requestRide = async (pickup, destination, fare) => {
  return (await api.post('/ride/request', { pickup, destination, fare })).data;
};

export const getAvailableRides = async () => {
  return (await api.get('/rides/available')).data;
};

export const acceptRide = async (rideId) => {
  return (await api.post('/ride/accept', { rideId })).data;
};

export const completeRide = async (rideId) => {
  return (await api.post('/ride/complete', { rideId })).data;
};

export const cancelRide = async (rideId) => {
  return (await api.post('/ride/cancel', { rideId })).data;
};

export const rateRide = async (rideId, rating, feedback) => {
  return (await api.post('/ride/rate', { rideId, rating, feedback })).data;
};

export const updateDriverStatus = async (isOnline) => {
  return (await api.post('/driver/status', { isOnline })).data;
};

export const getDriverEarnings = async () => {
  return (await api.get('/driver/earnings')).data;
};

export const logout = async () => {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
};

export default api;