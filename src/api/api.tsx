// constants/api.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://192.168.88.85:8000/api"; // Use http://10.0.2.2:8000 for Android Emulator

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // Added timeout to prevent hanging
});

// Add access token from AsyncStorage
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- AUTHENTICATION ---
export const login = (data: { email: string; password: string }) =>
  api.post("/accounts/login/", data);

export const registerUser = async (userData: {
  username: string;
  email: string;
  password: string;
  password2: string;
}) => {
  try {
    const response = await api.post("/accounts/register/", userData);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw error.response.data;
    } else {
      throw { detail: "Network error or server not reachable." };
    }
  }
};

export const forgotPassword = async (data: { email: string }) => {
  try {
    const response = await api.post("/accounts/forgot-password/", data);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw error.response.data;
    } else {
      throw { detail: "Network error or server not reachable." };
    }
  }
};

export const resetPassword = async (data: {
  email: string;
  verification_code: string;
  new_password: string;
}) => {
  try {
    const response = await api.post("/accounts/reset-password/", data);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw error.response.data;
    } else {
      throw { detail: "Network error or server not reachable." };
    }
  }
};

export const logout = () => api.post("/auth/logout/");

export const refreshToken = (data: { refresh: string }) =>
  api.post("/token/refresh/", data);

// --- PROFILE ---
export const getProfile = () => api.get("/accounts/profile/");
export const updateProfile = (data: any) =>
  api.put("/accounts/profile/", data);

// --- SHIPPING ADDRESSES ---
export const getShippingAddresses = () =>
  api.get("/accounts/shipping-addresses/");
export const createShippingAddress = (data: any) =>
  api.post("/accounts/shipping-addresses/", data);
export const updateShippingAddress = (id: number, data: any) =>
  api.put(`/accounts/shipping-addresses/${id}/`, data);
export const deleteShippingAddress = (id: number) =>
  api.delete(`/accounts/shipping-addresses/${id}/`);

// --- PRODUCTS ---
export const getProducts = () => api.get("/products/");
export const getProduct = (id: number) => api.get(`/products/${id}/`);
export const getCategories = () => api.get("/products/categories/");

// --- CART & CART ITEMS ---
export const getCart = () => api.get("/orders/carts/");
export const addToCart = (data: any) => api.post("/orders/cart-items/", data);
export const updateCartItem = (id: number, data: any) =>
  api.put(`/orders/cart-items/${id}/`, data);
export const deleteCartItem = (id: number) =>
  api.delete(`/orders/cart-items/${id}/`);

// --- COUPONS ---
export const applyCoupon = (data: { code: string }) =>
  api.post("/orders/apply-coupon/", data);

// --- ORDERS ---
export const getOrders = () => api.get("/orders/orders/");
export const createOrder = (data: any) => api.post("/orders/orders/", data);

// --- PAYMENTS ---
export const initiatePayment = (data: any) =>
  api.post("/orders/payment/initiate/", data);

// --- NOTIFICATIONS ---
export const sendOrderNotification = (orderId: number) =>
  api.post(`/notifications/send/order/${orderId}/`);

export default api;