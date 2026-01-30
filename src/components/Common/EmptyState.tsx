import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        {icon && <div className="mb-4 flex justify-center text-gray-300">{icon}</div>}
        <h3 className="text-base font-semibold text-gray-800">
          {title}
        </h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}
