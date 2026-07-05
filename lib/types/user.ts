export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone: string;
  avatar?: string;
  tenant: Tenant | null;
  permissions?: UserPermissions;
  last_login?: string;
  date_joined?: string;
}

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  business_type: string;
  is_active: boolean;
  plan_type: string;
  active_modules: string[];
}

export interface UserPermissions {
  is_admin: boolean;
  is_manager: boolean;
  is_supervisor: boolean;
  is_accountant: boolean;
  is_viewer: boolean;
  can_approve_purchases: boolean;
  can_manage_users: boolean;
  can_view_financials: boolean;
  can_edit_data: boolean;
  modules: {
    sales: boolean;
    purchase: boolean;
    inventory: boolean;
    construction: boolean;
    accounting: boolean;
    reports: boolean;
    pos: boolean;
    hr: boolean;
    hardware: boolean;
    settings: boolean;
    dashboard: boolean;
  };
}

export interface NotificationPreferences {
  email_order_updates: boolean;
  email_payment_reminders: boolean;
  email_inventory_alerts: boolean;
  email_team_activity: boolean;
  push_desktop: boolean;
  push_mobile: boolean;
  push_sound: boolean;
  login_alerts: boolean;
  security_log_exports: boolean;
}

export interface PrivacyPreferences {
  profile_visibility: 'everyone' | 'organization' | 'private';
  activity_status: boolean;
  search_indexing: boolean;
  data_retention_years: 1 | 5 | 0;
}

export interface Session {
  id: string;
  device: string;
  location: string;
  ip_address: string;
  last_active: string;
  is_current: boolean;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
}

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar?: File;
}

export interface AppearancePreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'en-US' | 'en-GB' | 'es' | 'fr' | 'de' | 'hi';
  timezone: string;
  date_calendar_system: 'AD' | 'BS';
  compact_mode: boolean;
  smooth_animations: boolean;
}
