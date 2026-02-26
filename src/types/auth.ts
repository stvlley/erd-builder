export interface User {
  id: string;
  display_name: string;
  username: string;
  password_hash: string;
  role: "user" | "admin";
  created_at: string;
  last_login_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface ERDRecord {
  id: string;
  user_id: string;
  name: string;
  data: unknown;
  created_at: string;
  updated_at: string;
}
