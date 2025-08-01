import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://3.82.235.244/api"; // Use http://10.0.2.2:8000 for Android Emulator

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
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

export const registerUser = async (data: {
  username: string;
  email: string;
  password: string;
  password2: string;
}) => {
  try {
    const response = await api.post("/accounts/register/", data);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw error.response.data;
    } else {
      throw { detail: "Network error or server not reachable." };
    }
  }
};

export const verifyEmail = async (data: { email: string; code: string }) => {
  try {
    const response = await api.post("/accounts/verify-email/", data);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw error.response.data;
    } else {
      throw { detail: "Network error or server not reachable." };
    }
  }
};

export const resendVerificationCode = async (data: { email: string }) => {
  try {axios.create
    const response = await api.post("/accounts/forgot-password/", data);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw error.response.data;
    } else {axios.create
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
export const getShippingAddresses = () => api.get("/accounts/addresses/");
export const createShippingAddress = (data: any) =>
  api.post("/accounts/addresses/", data);
export const updateShippingAddress = (id: number, data: any) =>
  api.put(`/accounts/addresses/${id}/`, data);
export const deleteShippingAddress = (id: number) =>
  api.delete(`/accounts/addresses/${id}/`);

// --- PRODUCTS ---
export const getProducts = async (searchQuery: string = '') => {
  try {
    const response = await api.get("/products/", {
      params: { search: searchQuery },
    });
    return response;
  } catch (error: any) {
    if (error.response) {
      throw error.response.data;
    } else {
      throw { detail: "Network error or server not reachable." };
    }
  }
};

export const getProduct = (id: number) => api.get(`/products/${id}/`);

export const getCategories = async () => {
  try {
    const response = await api.get("/products/");
    const products = response.data;
    const categories = [...new Set(products.map((product) => product.category.name))];
    return { data: categories };
  } catch (error: any) {
    if (error.response) {
      throw error.response.data;
    } else {
      throw { detail: "Network error or server not reachable." };
    }
  }
};

// --- CART & CART ITEMS ---
export const getCartItems = () => api.get("/orders/cart/items/");

export const addToCart = (data: { product_id: number; variant_id: number; quantity: number }) =>
  api.post("/orders/cart/items/", data);

export const updateCartItem = (id: number, data: { quantity: number }) =>
  api.patch(`/orders/cart/items/${id}/`, data);

export const deleteCartItem = (id: number) =>
  api.delete(`/orders/cart/items/${id}/`);

// --- COUPONS ---
export const applyCoupon = (data: { code: string }) =>
  api.post("/orders/apply-coupon/", data);

// --- ORDERS ---
export const getOrders = () => api.get("/orders/orders/");
export const createOrder = (data: any) => api.post("/orders/orders/", data);
export const getOrderDetail = (orderId: number) => api.get(`/orders/orders/${orderId}/`);

// --- PAYMENTS ---
export const initiatePayment = async (data: { shipping_address_id: number }) => {
  try {
    const response = await api.post("/orders/payment/initiate/", data);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw error.response.data;
    } else {
      throw { detail: "Network error or server not reachable." };
    }
  }
};
// --- BANNERS ---
export const getBanners = async () => {
  try {
    const response = await api.get("products/banners/");
    return response;
  } catch (error: any) {
    if (error.response) {
      throw error.response.data;
    } else {
      throw { detail: "Network error or server not reachable." };
    }
  }
};


// --- NOTIFICATIONS ---
export const sendOrderNotification = (orderId: number) =>
  api.post(`/notifications/send/order/${orderId}/`);

export default api;