import { ReactNode } from 'react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import toast from 'react-hot-toast';

interface ProtectedActionProps {
  module: string;
  action: 'View' | 'Create' | 'Edit' | 'Delete' | 'Export';
  children: ReactNode;
  fallback?: ReactNode;
  onUnauthorized?: () => void;
  showToast?: boolean;
}

export function ProtectedAction({
  module,
  action,
  children,
  fallback = null,
  onUnauthorized,
  showToast = true,
}: ProtectedActionProps) {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return null;
  }

  const allowed = hasPermission(module, action);

  if (!allowed) {
    if (onUnauthorized) {
      onUnauthorized();
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface ProtectedButtonProps extends ProtectedActionProps {
  onClick?: () => void;
}

export function ProtectedButton({
  module,
  action,
  children,
  onClick,
  showToast = true,
  ...props
}: ProtectedButtonProps) {
  const { hasPermission } = usePermissions();

  const handleClick = () => {
    if (!hasPermission(module, action)) {
      if (showToast) {
        toast.error(`You don't have permission to ${action.toLowerCase()} ${module.toLowerCase()}`);
      }
      return;
    }
    onClick?.();
  };

  return (
    <ProtectedAction module={module} action={action} {...props}>
      <div onClick={handleClick}>{children}</div>
    </ProtectedAction>
  );
}
