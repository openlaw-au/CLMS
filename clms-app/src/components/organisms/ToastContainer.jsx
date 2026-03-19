import { useToast } from '../../context/ToastContext';
import Toast from '../atoms/Toast';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-slide-in-right"
        >
          <Toast
            message={toast.message}
            type={toast.type}
            icon={toast.icon}
            onDismiss={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}
