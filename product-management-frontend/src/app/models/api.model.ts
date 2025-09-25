export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  details?: string;
  statusCode: number;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}