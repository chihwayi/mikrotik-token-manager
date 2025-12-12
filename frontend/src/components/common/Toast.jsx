import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast.autoClose) {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, toast.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success: {
      bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
      border: 'border-green-400',
      icon: 'text-white',
      text: 'text-white',
    },
    error: {
      bg: 'bg-gradient-to-r from-red-500 to-red-600',
      border: 'border-red-400',
      icon: 'text-white',
      text: 'text-white',
    },
    warning: {
      bg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      border: 'border-yellow-400',
      icon: 'text-white',
      text: 'text-white',
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
      border: 'border-blue-400',
      icon: 'text-white',
      text: 'text-white',
    },
  };

  const Icon = icons[toast.type] || Info;
  const colorScheme = colors[toast.type] || colors.info;

  return (
    <div
      className={`
        relative flex items-center gap-3 p-4 rounded-xl shadow-2xl
        ${colorScheme.bg} ${colorScheme.text}
        animate-slide-in-right border-l-4 ${colorScheme.border}
        w-full sm:min-w-[300px] sm:max-w-[500px] transform transition-all duration-300
        hover:scale-105 cursor-pointer
      `}
      onClick={() => onClose(toast.id)}
    >
      <div className="flex-shrink-0">
        <Icon className={`w-6 h-6 ${colorScheme.icon}`} />
      </div>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <div className="font-bold text-sm mb-1">{toast.title}</div>
        )}
        <div className="text-sm font-medium">{toast.message}</div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose(toast.id);
        }}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-black/20 transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
      
      {/* Progress bar */}
      {toast.autoClose && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 rounded-b-xl overflow-hidden">
          <div
            className="h-full bg-white/50 animate-progress"
            style={{
              animation: `progress ${toast.duration || 5000}ms linear forwards`,
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }

        .animate-progress {
          animation: progress ${toast.duration || 5000}ms linear forwards;
        }
      `}</style>
    </div>
  );
};

export default Toast;

