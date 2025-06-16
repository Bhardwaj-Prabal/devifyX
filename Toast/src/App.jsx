import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, Info, Undo2 } from 'lucide-react';

const ToastContext = createContext();


const TOAST_TYPES = {
  success: {
    icon: CheckCircle,
    className: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
    iconColor: 'text-green-500 dark:text-green-400',
    progressColor: 'bg-green-500 dark:bg-green-400'
  },
  error: {
    icon: AlertCircle,
    className: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
    iconColor: 'text-red-500 dark:text-red-400',
    progressColor: 'bg-red-500 dark:bg-red-400'
  },
  info: {
    icon: Info,
    className: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
    iconColor: 'text-blue-500 dark:text-blue-400',
    progressColor: 'bg-blue-500 dark:bg-blue-400'
  },
  warning: {
    icon: AlertCircle,
    className: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300',
    iconColor: 'text-yellow-500 dark:text-yellow-400',
    progressColor: 'bg-yellow-500 dark:bg-yellow-400'
  }
};

const POSITIONS = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
};

const Toast = ({ toast, onDismiss, onUndo }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);
  const progressRef = useRef(null);
  const timeoutRef = useRef(null);
  const startTimeRef = useRef(null);
  const remainingTimeRef = useRef(toast.duration);

  const toastConfig = TOAST_TYPES[toast.type] || TOAST_TYPES.info;
  const IconComponent = toastConfig.icon;

  const startTimer = useCallback(() => {
    if (remainingTimeRef.current <= 0) return;
    
    startTimeRef.current = Date.now();
    timeoutRef.current = setTimeout(() => {
      handleDismiss();
    }, remainingTimeRef.current);

    if (progressRef.current) {
      progressRef.current.style.transition = `width ${remainingTimeRef.current}ms linear`;
      progressRef.current.style.width = '0%';
    }
  }, []);

  const pauseTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
      
      if (progressRef.current) {
        const currentWidth = (remainingTimeRef.current / toast.duration) * 100;
        progressRef.current.style.transition = 'none';
        progressRef.current.style.width = `${currentWidth}%`;
      }
    }
  }, [toast.duration]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onDismiss(toast.id), 300);
  }, [toast.id, onDismiss]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      handleDismiss();
    }
  }, [handleDismiss]);

  useEffect(() => {
    setIsVisible(true);
    if (toast.duration > 0) {
      startTimer();
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [startTimer, toast.duration]);

  useEffect(() => {
    if (toast.duration > 0) {
      if (isHovered) {
        pauseTimer();
      } else {
        startTimer();
      }
    }
  }, [isHovered, startTimer, pauseTimer, toast.duration]);

  useEffect(() => {
    if (!isHovered && progressRef.current && toast.duration > 0) {
      setProgress((remainingTimeRef.current / toast.duration) * 100);
    }
  }, [isHovered, toast.duration]);

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      tabIndex={0}
      className={`
        relative max-w-sm w-full border rounded-lg shadow-lg p-4 mb-3
        transform transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
        ${toastConfig.className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
    >
  
      {toast.duration > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
          <div
            ref={progressRef}
            className={`h-full ${toastConfig.progressColor} transition-all ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex items-start">
        <div className="flex-shrink-0">
          <IconComponent className={`h-5 w-5 ${toastConfig.iconColor}`} aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          {toast.title && (
            <h3 className="text-sm font-medium mb-1">{toast.title}</h3>
          )}
          <p className="text-sm">{toast.message}</p>
          
          {toast.undoAction && (
            <button
              onClick={() => onUndo?.(toast)}
              className="mt-2 inline-flex items-center text-xs font-medium hover:underline focus:outline-none focus:underline"
              aria-label="Undo action"
            >
              <Undo2 className="h-3 w-3 mr-1" />
              Undo
            </button>
          )}
        </div>


        <div className="ml-4 flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="inline-flex rounded-md p-1.5 hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ToastContainer = ({ position = 'top-right', maxToasts = 5 }) => {
  const { toasts, removeToast, undoAction } = useContext(ToastContext);
  
  const positionClasses = POSITIONS[position] || POSITIONS['top-right'];
  const displayedToasts = toasts.slice(0, maxToasts);

  if (displayedToasts.length === 0) return null;

  return (
    <div
      className={`fixed z-50 pointer-events-none ${positionClasses}`}
      aria-live="polite"
      aria-label="Notifications"
    >
      <div className="pointer-events-auto space-y-2">
        {displayedToasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onDismiss={removeToast}
            onUndo={undoAction}
          />
        ))}
      </div>
    </div>
  );
};

const ToastProvider = ({ children, defaultOptions = {} }) => {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((options) => {
    const id = ++toastIdRef.current;
    const toast = {
      id,
      type: 'info',
      duration: 5000,
      ...defaultOptions,
      ...options,
      timestamp: Date.now()
    };

    setToasts(prev => [toast, ...prev]);
    return id;
  }, [defaultOptions]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const undoAction = useCallback((toast) => {
    if (toast.undoAction) {
      toast.undoAction();
      removeToast(toast.id);
    }
  }, [removeToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
    undoAction
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastDemo = () => {
  const { addToast, removeAllToasts } = useToast();
  const [isDark, setIsDark] = useState(false);
  const [position, setPosition] = useState('top-right');
  const undoCountRef = useRef(0);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const showToast = (type) => {
    const messages = {
      success: ['Success! Your changes have been saved.', 'Operation completed successfully!', 'Data synchronized successfully.'],
      error: ['Error! Something went wrong.', 'Failed to save changes.', 'Network connection error.'],
      info: ['New update available.', 'System maintenance scheduled.', 'Your session will expire soon.'],
      warning: ['Warning! Please review your input.', 'Storage space is running low.', 'Unsaved changes detected.']
    };

    const typeMessages = messages[type] || messages.info;
    const message = typeMessages[Math.floor(Math.random() * typeMessages.length)];

    addToast({
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      message,
      duration: 5000,
      undoAction: type === 'success' ? () => {
        undoCountRef.current++;
        addToast({
          type: 'info',
          message: `Undo action executed! (${undoCountRef.current})`,
          duration: 3000
        });
      } : undefined
    });
  };

  const showPersistentToast = () => {
    addToast({
      type: 'info',
      title: 'Persistent Toast',
      message: 'This toast will not auto-dismiss. Click the X to close it.',
      duration: 0 
    });
  };

  return (
    <div className={`min-h-screen p-8 transition-colors duration-200 ${
      isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Toast Notification Queue Demo</h1>
        
     
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Controls</h2>
          
   
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-900 dark:text-gray-100">Theme:</span>
            <button
              onClick={() => setIsDark(!isDark)}
              className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>

          <div className="flex items-center justify-between mb-6">
            <span className="text-gray-900 dark:text-gray-100">Position:</span>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {Object.keys(POSITIONS).map(pos => (
                <option key={pos} value={pos}>
                  {pos.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {Object.keys(TOAST_TYPES).map(type => (
              <button
                key={type}
                onClick={() => showToast(type)}
                className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
                  type === 'success' ? 'bg-green-500 hover:bg-green-600' :
                  type === 'error' ? 'bg-red-500 hover:bg-red-600' :
                  type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600' :
                  'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={showPersistentToast}
              className="px-4 py-2 rounded-md bg-purple-500 text-white hover:bg-purple-600 transition-colors"
            >
              Persistent Toast
            </button>
            <button
              onClick={removeAllToasts}
              className="px-4 py-2 rounded-md bg-gray-500 text-white hover:bg-gray-600 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Features Demonstrated</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Core Features:</h3>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>✓ Queue system with vertical stacking</li>
                <li>✓ Auto-dismiss with configurable timeout</li>
                <li>✓ Manual dismiss with close button</li>
                <li>✓ Multiple toast types (success, error, info, warning)</li>
                <li>✓ Customizable messages and titles</li>
                <li>✓ Smooth enter/exit animations</li>
                <li>✓ Configurable positioning</li>
                <li>✓ Full accessibility support</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Bonus Features:</h3>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>✓ Pause on hover functionality</li>
                <li>✓ Visual progress bar indicator</li>
                <li>✓ Undo action support</li>
                <li>✓ Dark/Light theme support</li>
                <li>✓ Responsive design</li>
                <li>✓ Keyboard navigation (ESC to dismiss)</li>
                <li>✓ Persistent toasts option</li>
                <li>✓ Maximum toast limit</li>
              </ul>
            </div>
          </div>
        </div>
      </div>


      <ToastContainer position={position} maxToasts={5} />
    </div>
  );
};

const App = () => {
  return (
    <ToastProvider defaultOptions={{ duration: 5000 }}>
      <ToastDemo />
    </ToastProvider>
  );
};

export default App;