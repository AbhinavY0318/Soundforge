export type LicenseType = 'royalty_free' | 'sync' | 'full_ownership';
export type GenerationStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
export type ApiKeyMode = 'test' | 'live';
export type ApiKeyStatus = 'active' | 'revoked' | 'rotating';
export type PlanName = 'SANDBOX' | 'STARTER' | 'GROWTH';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  isEmailVerified: boolean;
}

export interface Account {
  id: string;
  name: string;
  status: 'active' | 'suspended' | 'canceled';
  overageEnabled: boolean;
}

export interface Plan {
  name: PlanName;
  displayName: string;
  monthlyAllowance: number;
  parallelLimit: number;
  requestsPerHour: number;
  requestsPerDay: number;
  allowedLicenses: LicenseType[];
  allowTestKeysOnly?: boolean;
  overageAllowed: boolean;
  priceMonthlyUsd?: number;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  mode: ApiKeyMode;
  scopes: string[];
  status: ApiKeyStatus;
  createdAt: string;
  rotatesAt?: string | null;
  lastUsedAt?: string | null;
}

export interface Generation {
  _id?: string;
  id?: string;
  prompt: string;
  durationSec: number;
  durationUnits?: number;
  license: LicenseType;
  instrumental: boolean;
  status: GenerationStatus;
  creditsReserved: number;
  creditsCharged: number;
  audioUrl?: string | null;
  storageKey?: string;
  provider: string;
  model: string;
  progress?: number;
  error?: {
    code?: string;
    message?: string;
  };
  queuedAt?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface UsageOverview {
  plan: Plan;
  periodMonth: string;
  credits: {
    monthlyAllowance: number;
    used: number;
    reserved: number;
    totalConsumed: number;
    remaining: number;
    overageUsed: number;
    overageEnabled: boolean;
  };
  dailyUsage: Array<{
    date: string;
    credits: number;
    count: number;
  }>;
  perKeyUsage: Array<{
    apiKeyId: string;
    keyName: string;
    keyPrefix: string;
    mode: ApiKeyMode;
    credits: number;
    generationsCount: number;
  }>;
  recentLedger: Array<{
    _id: string;
    eventType: 'reservation' | 'charge' | 'refund' | 'adjustment';
    credits: number;
    description: string;
    createdAt: string;
  }>;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  description?: string | null;
  events: string[];
  active: boolean;
  createdAt?: string;
  created_at?: string;
}

export interface WebhookDelivery {
  id: string;
  delivery_id: string;
  endpoint_id: string;
  event: string;
  status: 'pending' | 'success' | 'failed';
  status_code?: number | null;
  attempt: number;
  duration_ms?: number | null;
  error?: string | null;
  created_at: string;
}

export interface TeamMember {
  _id: string;
  role: 'owner' | 'admin' | 'member';
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
}
