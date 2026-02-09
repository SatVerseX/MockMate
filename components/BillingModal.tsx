import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  Calendar, 
  AlertTriangle, 
  Loader2, 
  Mail, 
  Crown,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Button } from './Button';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: {
    plan_id?: string;
    status?: string;
    current_period_end?: string;
    razorpay_subscription_id?: string;
  } | null;
  planName: string;
  planPrice: number;
  planInterval: string;
  onCancelSubscription: () => Promise<void>;
  cancelling: boolean;
}

export const BillingModal: React.FC<BillingModalProps> = ({
  isOpen,
  onClose,
  subscription,
  planName,
  planPrice,
  planInterval,
  onCancelSubscription,
  cancelling
}) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = async () => {
    try {
      setCancelError(null);
      await onCancelSubscription();
      setCancelSuccess(true);
      setShowCancelConfirm(false);
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel subscription');
    }
  };

  const handleClose = () => {
    setShowCancelConfirm(false);
    setCancelSuccess(false);
    setCancelError(null);
    onClose();
  };

  const isActive = subscription?.status === 'active';
  const isCancelled = subscription?.status === 'cancelled';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header Gradient */}
        <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <X size={20} />
        </button>

        <div className="p-6 pt-8">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-emerald-500" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-zinc-900 dark:text-white mb-2">
            Manage Subscription
          </h2>
          <p className="text-center text-zinc-500 dark:text-zinc-400 mb-6">
            View and manage your billing details
          </p>

          {/* Subscription Details Card */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-5 mb-6 space-y-4">
            {/* Plan Name */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-amber-500" />
                <div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">Current Plan</div>
                  <div className="font-semibold text-zinc-900 dark:text-white">{planName}</div>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                isActive 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' 
                  : isCancelled
                    ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400'
              }`}>
                {subscription?.status?.charAt(0).toUpperCase() + subscription?.status?.slice(1) || 'Unknown'}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-zinc-400" />
              <div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Amount</div>
                <div className="font-semibold text-zinc-900 dark:text-white">
                  ₹{planPrice / 100}/{planInterval}
                </div>
              </div>
            </div>

            {/* Next Billing Date */}
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-zinc-400" />
              <div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  {isCancelled ? 'Access Until' : 'Next Billing'}
                </div>
                <div className="font-semibold text-zinc-900 dark:text-white">
                  {formatDate(subscription?.current_period_end)}
                </div>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {cancelSuccess && (
            <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-emerald-700 dark:text-emerald-400">Subscription Cancelled</div>
                <div className="text-sm text-emerald-600 dark:text-emerald-300/80">
                  You'll have access until {formatDate(subscription?.current_period_end)}
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {cancelError && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-red-700 dark:text-red-400">Cancellation Failed</div>
                <div className="text-sm text-red-600 dark:text-red-300/80">{cancelError}</div>
              </div>
            </div>
          )}

          {/* Cancel Confirmation */}
          {showCancelConfirm && !cancelSuccess && (
            <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-amber-700 dark:text-amber-400">Cancel Subscription?</div>
                  <div className="text-sm text-amber-600 dark:text-amber-300/80">
                    You'll lose access to premium features after the current billing period ends.
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={cancelling}
                >
                  Keep Subscription
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={handleConfirmCancel}
                  disabled={cancelling}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {cancelling ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Cancelling...
                    </span>
                  ) : (
                    'Yes, Cancel'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!showCancelConfirm && !cancelSuccess && isActive && (
            <div className="space-y-3">
              <Button
                variant="outline"
                fullWidth
                onClick={handleCancelClick}
                className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/10"
              >
                Cancel Subscription
              </Button>
            </div>
          )}

          {/* Contact Support */}
          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 text-center mb-3">
              Need help? Contact our support team
            </p>
            <Button
              variant="ghost"
              fullWidth
              size="sm"
              onClick={() => window.open('mailto:support@mockmate.ai?subject=Billing Support Request', '_blank')}
              leftIcon={<Mail className="w-4 h-4" />}
              className="text-zinc-600 dark:text-zinc-400"
            >
              support@mockmate.ai
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
