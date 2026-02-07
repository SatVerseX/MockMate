import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X, ExternalLink } from 'lucide-react';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    isVisible: boolean;
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000); // Auto close after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div 
                className={`
                    relative w-full max-w-md p-6 overflow-hidden
                    bg-zinc-900/90 dark:bg-black/90 backdrop-blur-xl
                    border border-white/10 rounded-2xl shadow-2xl
                    transform transition-all duration-300 ease-out
                    animate-slide-up
                    flex flex-col items-center text-center
                `}
            >
                {/* Background Glow Effect */}
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
                    type === 'success' 
                        ? 'from-emerald-500 via-teal-500 to-emerald-500' 
                        : 'from-red-500 via-orange-500 to-red-500'
                }`} />
                
                <div className={`absolute -top-20 -left-20 w-40 h-40 rounded-full blur-[80px] opacity-20 pointer-events-none ${
                    type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                }`} />

                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
                >
                    <X size={20} />
                </button>

                {/* Icon */}
                <div className={`mb-4 p-3 rounded-full bg-white/5 border border-white/10 ${
                    type === 'success' ? 'text-emerald-500' : 'text-red-500'
                }`}>
                    {type === 'success' ? (
                        <CheckCircle size={32} className="animate-bounce-subtle" />
                    ) : (
                        <XCircle size={32} className="animate-pulse" />
                    )}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-2">
                    {type === 'success' ? 'Payment Successful!' : 'Payment Failed'}
                </h3>
                
                <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
                    {message}
                </p>

                {/* Action Button */}
                <button 
                    onClick={onClose}
                    className={`
                        w-full py-3 px-4 rounded-xl font-medium text-white shadow-lg
                        transform transition-all duration-200 active:scale-95
                        flex items-center justify-center gap-2
                        ${type === 'success' 
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20' 
                            : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 shadow-red-500/20'
                        }
                    `}
                >
                    {type === 'success' ? 'Continue to Dashboard' : 'Try Again'}
                    {type === 'success' && <ExternalLink size={16} />}
                </button>
            </div>
        </div>
    );
};
