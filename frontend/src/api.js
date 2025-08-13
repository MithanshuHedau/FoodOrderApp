import axios from "axios";

// Simple axios instance with JWT support from localStorage
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const setToken = (token) => {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
};

export const getToken = () => localStorage.getItem("token");

export const authApi = {
  signup: async (formData) => {
    return api.post("/auth/signup", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  login: async ({ email, password }) =>
    api.post("/auth/login", { email, password }),
  getUser: async (id) => api.get(`/auth/user/${id}`),
  updatePassword: async (id, { oldPassword, newPassword }) =>
    api.put(`/auth/user/${id}/password`, { oldPassword, newPassword }),
  updatePhoto: async (id, file) => {
    const fd = new FormData();
    fd.append("photo", file);
    return api.put(`/auth/user/${id}/photo`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const userApi = {
  // Restaurants and categories
  getPublicRestaurants: async () => api.get("/public/restaurants"),
  getPublicRestaurant: async (id) => api.get(`/public/restaurants/${id}`),
  getPublicRestaurantMenu: async (id) =>
    api.get(`/public/restaurants/${id}/menu`),
  getPublicRestaurantReviews: async (id) =>
    api.get(`/public/restaurants/${id}/reviews`),
  getRestaurants: async () => api.get("/user/restaurents"),
  getRestaurant: async (id) => api.get(`/user/restaurents/${id}`),
  getRestaurantMenu: async (id) => api.get(`/user/restaurents/${id}/menu`),
  getMenuItem: async (id) => api.get(`/user/menu/${id}`),
  getCategories: async () => api.get("/user/categories"),

  // Cart
  addToCart: async (payload) => api.post("/user/cart", payload), // supports {menuItemId, quantity} or {items:[]}
  getCart: async () => api.get("/user/cart"),
  updateCartItem: async (menuItemId, quantity) =>
    api.put(`/user/cart/${menuItemId}`, { quantity }),
  removeCartItem: async (menuItemId) => api.delete(`/user/cart/${menuItemId}`),
  clearCart: async () => api.delete("/user/cart"),

  // Orders
  createOrder: async ({ deliveryAddress }) =>
    api.post("/user/orders", { deliveryAddress }),
  getOrders: async () => api.get("/user/orders"),
  getOrder: async (id) => api.get(`/user/orders/${id}`),
  cancelOrder: async (id) => api.put(`/user/orders/${id}/cancel`),

  // Payments
  createPayment: async ({ orderId, paymentMethod }) =>
    api.post("/user/payment/create", { orderId, paymentMethod }),
  verifyPayment: async ({ paymentId, status, transactionId }) =>
    api.post("/user/payment/verify", { paymentId, status, transactionId }),
  getPaymentStatus: async (id) => api.get(`/user/payment/status/${id}`),

  // Reviews
  createOrUpdateReview: async ({ restaurantId, rating, comment }) =>
    api.post("/user/reviews", { restaurantId, rating, comment }),
  getReview: async (id) => api.get(`/user/reviews/${id}`),
};

export const adminApi = {
  // Restaurants
  createRestaurant: async (data) => {
    // data: { name, description, address, phone, openingHours, image|photo: File }
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, v);
    });
    // Accept both image or photo key; prefer image
    if (data.image && !fd.has("image")) fd.append("image", data.image);
    if (!fd.has("image") && data.photo) fd.append("photo", data.photo);
    return api.post("/admin/restaurants", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  listRestaurants: async () => api.get("/admin/restaurents"),
  getRestaurant: async (id) => api.get(`/admin/restaurents/${id}`),
  updateRestaurant: async (id, data) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, v);
    });
    return api.put(`/admin/restaurents/${id}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteRestaurant: async (id) => api.delete(`/admin/restaurents/${id}`),

  // Categories
  createCategory: async ({ name, description }) =>
    api.post("/admin/categories", { name, description }),
  listCategories: async () => api.get("/admin/categories"),
  updateCategory: async (id, { name, description }) =>
    api.put(`/admin/categories/${id}`, { name, description }),
  deleteCategory: async (id) => api.delete(`/admin/categories/${id}`),

  // Menu items for a restaurant
  createMenuItem: async (restaurantId, data) => {
    // data: { name, description, price, categoryId, available?, image|photo: File }
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, v);
    });
    if (data.image && !fd.has("image")) fd.append("image", data.image);
    if (!fd.has("image") && data.photo) fd.append("photo", data.photo);
    return api.post(`/admin/restaurents/${restaurantId}/menu`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  listMenuItems: async (restaurantId) =>
    api.get(`/admin/restaurents/${restaurantId}/menu`),
  getMenuItem: async (restaurantId, menuItemId) =>
    api.get(`/admin/restaurents/${restaurantId}/menu/${menuItemId}`),
  updateMenuItem: async (restaurantId, menuItemId, data) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, v);
    });
    if (data.image && !fd.has("image")) fd.append("image", data.image);
    if (!fd.has("image") && data.photo) fd.append("photo", data.photo);
    return api.put(
      `/admin/restaurents/${restaurantId}/menu/${menuItemId}`,
      fd,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
  },
  deleteMenuItem: async (restaurantId, menuItemId) =>
    api.delete(`/admin/restaurents/${restaurantId}/menu/${menuItemId}`),
  updateMenuItemById: async (menuItemId, data) =>
    api.put(`/admin/menu/${menuItemId}`, data),
  deleteMenuItemById: async (menuItemId) =>
    api.delete(`/admin/menu/${menuItemId}`),

  // Users
  listUsers: async () => api.get("/admin/users"),
  getUser: async (id) => api.get(`/admin/users/${id}`),
  updateUser: async (id, data) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, v);
    });
    if (data.image && !fd.has("image")) fd.append("image", data.image);
    if (!fd.has("image") && data.photo) fd.append("photo", data.photo);
    return api.put(`/admin/users/${id}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteUser: async (id) => api.delete(`/admin/users/${id}`),

  // Orders management
  listOrders: async (params = {}) => api.get("/admin/orders", { params }),
  getOrder: async (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: async (id, status) =>
    api.put(`/admin/orders/${id}/status`, { status }),
};

// Small helpers
export const getAuthUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setAuthUser = (user) => {
  if (!user) localStorage.removeItem("user");
  else localStorage.setItem("user", JSON.stringify(user));
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export default api;
