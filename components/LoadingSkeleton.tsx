import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: boolean;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = true,
}) => {
  const baseClasses = animation ? 'skeleton' : 'bg-zinc-800';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1em' : variant === 'circular' ? width : '100%'),
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

// Card Skeleton
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`glass-card p-6 space-y-4 ${className}`}>
    <div className="flex items-center gap-4">
      <LoadingSkeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <LoadingSkeleton variant="text" width="60%" height={20} />
        <LoadingSkeleton variant="text" width="40%" height={14} />
      </div>
    </div>
    <LoadingSkeleton variant="rectangular" height={100} />
    <div className="flex gap-2">
      <LoadingSkeleton variant="rectangular" width={80} height={32} />
      <LoadingSkeleton variant="rectangular" width={80} height={32} />
    </div>
  </div>
);

// List Skeleton
export const ListSkeleton: React.FC<{ items?: number; className?: string }> = ({ 
  items = 3,
  className = '' 
}) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="glass-card p-4 flex items-center gap-4">
        <LoadingSkeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <LoadingSkeleton variant="text" width="50%" height={16} />
          <LoadingSkeleton variant="text" width="30%" height={12} />
        </div>
        <LoadingSkeleton variant="rectangular" width={60} height={32} />
      </div>
    ))}
  </div>
);

// Screen Skeleton
export const ScreenSkeleton: React.FC = () => (
  <div className="min-h-screen bg-black p-6 space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <LoadingSkeleton variant="circular" width={40} height={40} />
      <LoadingSkeleton variant="rectangular" width={200} height={24} />
      <LoadingSkeleton variant="rectangular" width={80} height={32} />
    </div>
    
    {/* Hero */}
    <div className="text-center space-y-4 py-12">
      <LoadingSkeleton variant="circular" width={64} height={64} className="mx-auto" />
      <LoadingSkeleton variant="text" width={300} height={32} className="mx-auto" />
      <LoadingSkeleton variant="text" width={400} height={20} className="mx-auto" />
    </div>
    
    {/* Cards Grid */}
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  </div>
);

// Stats Skeleton
export const StatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="glass-card p-5 space-y-3">
        <LoadingSkeleton variant="rectangular" width={24} height={24} />
        <LoadingSkeleton variant="text" width="60%" height={32} />
        <LoadingSkeleton variant="text" width="40%" height={12} />
      </div>
    ))}
  </div>
);
