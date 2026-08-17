import { createPortal } from 'react-dom';
import { useToastStore, type ToastType } from '@/stores/toastStore';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

const variantStyles: Record<ToastType, string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
};

const iconMap: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

function ToastItem({ id, type, message }: { id: string; type: ToastType; message: string }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg',
        'animate-slide-in transition-all duration-300',
        'min-w-[260px] max-w-[420px]',
        variantStyles[type]
      )}
    >
      <span className="text-lg font-bold leading-none" aria-hidden>
        {iconMap[type]}
      </span>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => removeToast(id)}
        className="text-white/80 hover:text-white transition-colors text-lg leading-none"
        aria-label={t('common.dismiss')}
      >
        &times;
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem {...toast} />
        </div>
      ))}
    </div>,
    document.body
  );
}
