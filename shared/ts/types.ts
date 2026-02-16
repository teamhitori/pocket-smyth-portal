/**
 * Shared types and constants for Pocket Smyth Portal.
 * Used by the Portal UI (Next.js).
 */

// --- User Status ---

export type UserStatus = "pending" | "approved" | "active" | "revoked";

export type UserRole = "user" | "admin";

// --- B2C Custom Attribute Prefix ---

export const B2C_EXT_PREFIX =
  "extension_3575970a911e4699ad1ccc1a507d2312_" as const;

// --- User Claims (decoded from JWT) ---

export interface UserClaims {
  oid: string;
  email: string;
  status: UserStatus;
  role: UserRole;
  username?: string;
  containerPort?: number;
}

// --- Agent Status ---

export type AgentState = "running" | "stopped" | "starting" | "error" | "unknown";

export interface AgentStatus {
  state: AgentState;
  uptime?: number; // seconds
  cpu?: number; // percentage
  memory?: number; // MB
}

// --- API Response Types ---

export interface ApiError {
  detail: string;
}

export interface UserInfo {
  id: string;
  email: string;
  status: UserStatus;
  role: UserRole;
  username?: string;
  containerPort?: number;
  createdAt?: string;
}

// --- Username Validation ---

export const USERNAME_MIN_LENGTH = 4;
export const USERNAME_MAX_LENGTH = 10;
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

export const RESERVED_USERNAMES = [
  "admin",
  "app",
  "www",
  "api",
  "mail",
  "portal",
  "system",
  "root",
  "public",
  "static",
  "login",
  "dev",
] as const;
