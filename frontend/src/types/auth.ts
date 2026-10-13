export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: UserType;
  school_id: string | null;
  permissions: string[];
  /** Module keys this user can access (role grants ∩ school-enabled). Admins get all enabled. */
  modules?: string[];
  photo_url?: string | null;
}

export type UserType =
  | "super_admin"
  | "school_admin"
  | "teacher"
  | "student"
  | "parent"
  | "staff";

export interface LoginRequest {
  email: string;
  password: string;
  school_slug?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
