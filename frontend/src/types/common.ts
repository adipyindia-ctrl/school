export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: Array<{ field?: string; message: string; code?: string }>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  message: string;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
}
