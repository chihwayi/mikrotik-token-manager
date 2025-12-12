import { X, AlertTriangle, CheckCircle } from 'lucide-react';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, type = 'warning', confirmText = 'Confirm', cancelText = 'Cancel' }) => {
  if (!isOpen) return null;

  const iconColors = {
    warning: 'text-orange-500 bg-orange-100',
    danger: 'text-red-500 bg-red-100',
    info: 'text-blue-500 bg-blue-100',
    success: 'text-green-500 bg-green-100'
  };

  const buttonColors = {
    warning: 'bg-orange-600 hover:bg-orange-700',
    danger: 'bg-red-600 hover:bg-red-700',
    info: 'bg-blue-600 hover:bg-blue-700',
    success: 'bg-green-600 hover:bg-green-700'
  };

  const Icon = type === 'success' ? CheckCircle : AlertTriangle;
  const bgColor = iconColors[type] || iconColors.warning;
  const btnColor = buttonColors[type] || buttonColors.warning;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full transform animate-slide-up">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start space-x-4 flex-1">
            <div className={`flex-shrink-0 w-12 h-12 ${bgColor} rounded-full flex items-center justify-center`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2 text-sm font-medium text-white ${btnColor} rounded-lg transition-colors shadow-md`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

