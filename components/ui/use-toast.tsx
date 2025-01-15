import React, { createContext, useContext, useState } from 'react';

type ToastVariant = 'default' | 'destructive';

interface Toast {
    title: string;
    description?: string;
    variant?: ToastVariant;
}

interface ToastContextType {
    addToast: (toast: Toast) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (toast: Toast) => {
        setToasts((prev) => [...prev, toast]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t !== toast));
        }, 3000); // Automatically remove toast after 3 seconds
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-0 right-0 p-4 space-y-2 z-50">
                {toasts.map((toast, index) => (
                    <div key={index} className={`p-4 rounded shadow-lg transition-opacity duration-300 ${toast.variant === 'destructive' ? 'bg-red-500 text-white' : 'bg-white border border-gray-300 text-black'}`}>
                        <h4 className="font-bold">{toast.title}</h4>
                        {toast.description && <p className="mt-1">{toast.description}</p>}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};