export type Role = "student" | "teacher" | "individual" | "organization" | "business";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  password_salt: string;
  role: Role;
  green_points: number;
  created_at: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  greenPoints: number;
  createdAt: string;
}

export function toPublicUser(u: UserRow): PublicUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    greenPoints: u.green_points,
    createdAt: u.created_at,
  };
}
