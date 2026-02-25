export interface User {
  id: string;
  display_name: string;
  role: "user" | "admin";
  invite_code_id: string | null;
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

export interface InviteCode {
  id: string;
  code: string;
  label: string | null;
  created_by: string | null;
  redeemed_by: string | null;
  redeemed_at: string | null;
  is_active: boolean;
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
