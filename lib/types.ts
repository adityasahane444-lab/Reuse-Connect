export type Role = "student" | "teacher" | "individual" | "organization" | "business";

export interface Preferences {
  /** Let people who have no exchange with you start a chat. */
  allowMessages: boolean;
  /** Notify me about requests, acceptances, completions and ratings. */
  notifyExchanges: boolean;
  /** Notify me when someone joins an event I organize. */
  notifyEvents: boolean;
  /** Notify me when an accepted food pickup is about to expire. */
  notifyExpiry: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  allowMessages: true,
  notifyExchanges: true,
  notifyEvents: true,
  notifyExpiry: true,
};

export function normalizePreferences(raw: unknown): Preferences {
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const pick = (key: keyof Preferences) =>
    typeof src[key] === "boolean" ? (src[key] as boolean) : DEFAULT_PREFERENCES[key];
  return {
    allowMessages: pick("allowMessages"),
    notifyExchanges: pick("notifyExchanges"),
    notifyEvents: pick("notifyEvents"),
    notifyExpiry: pick("notifyExpiry"),
  };
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  password_salt: string;
  role: Role;
  green_points: number;
  avatar_url: string | null;
  bio: string;
  preferences: unknown;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
  email_verified: boolean;
  email_verification_code_hash: string | null;
  email_verification_expires_at: string | null;
  email_verification_sent_at: string | null;
  email_verification_attempts: number;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  greenPoints: number;
  avatarUrl: string | null;
  bio: string;
  isAdmin: boolean;
  preferences: Preferences;
  createdAt: string;
}

export function toPublicUser(u: UserRow): PublicUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    greenPoints: u.green_points,
    avatarUrl: u.avatar_url ?? null,
    bio: u.bio ?? "",
    isAdmin: Boolean(u.is_admin),
    preferences: normalizePreferences(u.preferences),
    createdAt: u.created_at,
  };
}

/** What other users are allowed to see about someone (no email, no preferences). */
export interface PublicProfile {
  id: string;
  name: string;
  role: Role;
  greenPoints: number;
  avatarUrl: string | null;
  bio: string;
  createdAt: string;
}

export function toPublicProfile(u: Pick<UserRow, "id" | "name" | "role" | "green_points" | "avatar_url" | "bio" | "created_at">): PublicProfile {
  return {
    id: u.id,
    name: u.name,
    role: u.role,
    greenPoints: u.green_points,
    avatarUrl: u.avatar_url ?? null,
    bio: u.bio ?? "",
    createdAt: u.created_at,
  };
}
