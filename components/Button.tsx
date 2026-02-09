import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  glow?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading, 
  leftIcon,
  rightIcon,
  fullWidth,
  glow,
  className = '', 
  disabled,
  ...props 
}) => {
  // Base styles
  const baseStyle = `
    relative inline-flex items-center justify-center gap-2 
    font-medium rounded-lg transition-all duration-200 
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black 
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    active:scale-[0.98]
  `;
  
  // Size variants
  const sizes: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
    xl: 'h-14 px-8 text-lg',
  };

  // Color variants
  const variants: Record<ButtonVariant, string> = {
    primary: `
      bg-zinc-900 dark:bg-white text-white dark:text-black border border-transparent 
      hover:bg-zinc-800 dark:hover:bg-gray-100 hover:shadow-[0_0_20px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]
      focus:ring-zinc-500 dark:focus:ring-white
    `,
    secondary: `
      bg-transparent text-zinc-700 dark:text-white border border-zinc-300 dark:border-zinc-700 
      hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600
      focus:ring-zinc-500
    `,
    outline: `
      bg-transparent text-zinc-700 dark:text-white border border-zinc-300 dark:border-zinc-700
      hover:bg-zinc-100 dark:hover:bg-white/5 hover:border-zinc-400 dark:hover:border-zinc-500
      focus:ring-zinc-500
    `,
    ghost: `
      bg-transparent text-zinc-500 dark:text-zinc-400 border border-transparent
      hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50
      focus:ring-zinc-500
    `,
    danger: `
      bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20
      hover:bg-red-500/20 hover:border-red-500/40
      focus:ring-red-500
    `,
    success: `
      bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20
      hover:bg-emerald-500/20 hover:border-emerald-500/40
      focus:ring-emerald-500
    `,
  };

  // Glow effect for primary buttons
  const glowStyle = glow && variant === 'primary' ? `
    before:content-[''] before:absolute before:inset-[-3px] 
    before:bg-gradient-to-r before:from-emerald-500 before:via-teal-500 before:to-cyan-500
    before:rounded-xl before:z-[-1] before:opacity-0 before:blur-sm
    before:transition-opacity before:duration-300
    hover:before:opacity-100
  ` : '';

  return (
    <button
      className={`
        ${baseStyle} 
        ${sizes[size]} 
        ${variants[variant]} 
        ${glowStyle}
        ${fullWidth ? 'w-full' : ''} 
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : leftIcon ? (
        <span className="flex-shrink-0">{leftIcon}</span>
      ) : null}
      
      {children}
      
      {rightIcon && !isLoading && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </button>
  );
};

// Icon Button variant
interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 'md',
  className = '',
  ...props
}) => {
  const iconSizes: Record<ButtonSize, string> = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
  };

  return (
    <Button
      size={size}
      className={`${iconSizes[size]} !p-0 ${className}`}
      {...props}
    >
      {icon}
    </Button>
  );
};