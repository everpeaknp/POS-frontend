import apiClient from './client';

export interface BillingPlan {
  code: string;
  name: string;
  price: number;
  max_users: number | null;
  features: string[];
  is_current: boolean;
}

export interface BillingSubscription {
  plan_code: string;
  plan_name: string;
  status: string;
  is_active: boolean;
  current_period_start: string | null;
  current_period_end: string | null;
  auto_renew: boolean;
  monthly_price: number;
}

export interface BillingPaymentRecord {
  id: number;
  transaction_uuid: string;
  plan_code: string;
  amount: number;
  status: string;
  payment_method: string;
  completed_at: string | null;
  created_at: string;
}

export interface BillingOverview {
  subscription: BillingSubscription;
  plans: BillingPlan[];
  payments: BillingPaymentRecord[];
  esewa_enabled: boolean;
  can_manage_billing: boolean;
}

export interface EsewaCheckoutForm {
  action_url: string;
  method: string;
  fields: Record<string, string>;
  transaction_uuid: string;
  total_amount: string;
  plan_name: string;
}

export interface PlanActivationResult {
  activated: true;
  message: string;
  subscription: BillingSubscription;
}

export type CheckoutResponse = EsewaCheckoutForm | PlanActivationResult;

export function isPlanActivation(result: CheckoutResponse): result is PlanActivationResult {
  return 'activated' in result && result.activated === true;
}

export const billingApi = {
  getOverview: async (): Promise<BillingOverview> => {
    const response = await apiClient.get<BillingOverview>('/billing/overview/');
    return response.data;
  },

  checkout: async (plan_code: string): Promise<CheckoutResponse> => {
    const response = await apiClient.post<CheckoutResponse>('/billing/checkout/', { plan_code });
    return response.data;
  },

  verify: async (transaction_uuid: string, data?: string) => {
    const response = await apiClient.post('/billing/verify/', {
      transaction_uuid,
      ...(data ? { data } : {}),
    });
    return response.data;
  },
};

/** Submit eSewa payment form by POSTing hidden fields to eSewa gateway. */
export function submitEsewaForm(checkout: EsewaCheckoutForm) {
  const form = document.createElement('form');
  form.method = checkout.method || 'POST';
  form.action = checkout.action_url;
  form.style.display = 'none';

  Object.entries(checkout.fields).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}
