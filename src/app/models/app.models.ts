export const API_BASE_URL = 'https://smart-retail-api.runasp.net';

export interface ApiResponse<T> {
  statusCode: number;
  isSuccess: boolean;
  message?: string;
  data?: T;
}

export interface UserProfile {
  id: string;
  userName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isActive: boolean;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    government?: string;
  };
}

export interface Store {
  id: number;
  name: string;
  address?: string;
  city?: string;
  latitude?: string;
  longitude?: string;
  isActive: boolean;
  createdAt: string;
  categoriesCount: number;
  productsCount: number;
  devicesCount: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  storeId: number;
  parentCategoryId?: number | null;
  parentCategoryName?: string | null;
  gridX?: number | null;
  gridY?: number | null;
  width?: number | null;
  height?: number | null;
  colorHex?: string | null;
  isDefault: boolean;
  isVisible: boolean;
  createdAt: string;
  productsCount: number;
  subCategories: Category[];
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  barcode: string;
  price: number;
  stock: number;
  isVisible: boolean;
  storeId: number;
  categoryId: number;
  categoryName?: string;
  createdAt: string;
}
