export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  budget_alert: 'Budget',
  task_reminder: 'Reminder',
  system_message: 'System',
  user_message: 'Message',
  approval_request: 'Approval',
  status_update: 'Update',
  inventory_alert: 'Inventory',
  payment_reminder: 'Payment',
  sales_alert: 'Sales',
  purchase_reminder: 'Purchase',
};

export function getNotificationTypeLabel(type: string): string {
  return NOTIFICATION_TYPE_LABELS[type] ?? type.replace(/_/g, ' ');
}
