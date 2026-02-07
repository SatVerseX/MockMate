import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

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
        <div className="toast-overlay">
            <div className={`toast-container ${type}`}>
                <div className="toast-icon">
                    {type === 'success' ? (
                        <CheckCircle size={48} />
                    ) : (
                        <XCircle size={48} />
                    )}
                </div>
                <h3 className="toast-title">
                    {type === 'success' ? '🎉 Payment Successful!' : '❌ Payment Failed'}
                </h3>
                <p className="toast-message">{message}</p>
                <button className="toast-close-btn" onClick={onClose}>
                    <X size={20} />
                </button>
                <button className="toast-action-btn" onClick={onClose}>
                    {type === 'success' ? 'Continue' : 'Try Again'}
                </button>
            </div>
        </div>
    );
};

// Styles
const toastStyles = `
.toast-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.toast-container {
    background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 24px;
    padding: 40px;
    max-width: 420px;
    width: 90%;
    text-align: center;
    position: relative;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

@keyframes slideUp {
    from { 
        opacity: 0;
        transform: translateY(30px) scale(0.95);
    }
    to { 
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.toast-container.success .toast-icon {
    color: #10b981;
    filter: drop-shadow(0 0 20px rgba(16, 185, 129, 0.5));
}

.toast-container.error .toast-icon {
    color: #ef4444;
    filter: drop-shadow(0 0 20px rgba(239, 68, 68, 0.5));
}

.toast-icon {
    margin-bottom: 20px;
    animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

.toast-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: white;
    margin-bottom: 12px;
    letter-spacing: -0.02em;
}

.toast-message {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 28px;
    line-height: 1.6;
}

.toast-close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    transition: all 0.2s ease;
}

.toast-close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
}

.toast-action-btn {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
    padding: 14px 40px;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
}

.toast-action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
}

.toast-container.error .toast-action-btn {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
}

.toast-container.error .toast-action-btn:hover {
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
}

/* Confetti animation for success */
.toast-container.success::before,
.toast-container.success::after {
    content: '🎊';
    position: absolute;
    font-size: 2rem;
    animation: confetti 1s ease-out;
}

.toast-container.success::before {
    top: -10px;
    left: 20px;
}

.toast-container.success::after {
    top: -10px;
    right: 20px;
    animation-delay: 0.2s;
}

@keyframes confetti {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(-30px) rotate(20deg); opacity: 0; }
}
`;

// Add styles to document
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.textContent = toastStyles;
    document.head.appendChild(styleElement);
}

export default Toast;
