import React from 'react';
import { Loader2 } from 'lucide-react';
import { ResearchStatus } from '../types';

interface ProgressStepperProps {
  status: ResearchStatus;
  progressPercent: number;
  message: string;
  topic: string;
  error?: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  status,
  progressPercent,
  message,
  topic,
  error,
  onRetry,
  onCancel,
}) => {
  return (
    <div className="max-w-md mx-auto py-20 px-6 text-center space-y-6">
      {error ? (
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-red-600 mb-2">
            <span className="text-xl font-bold">!</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-900">
              Unable to complete research
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              {error}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition shadow-xs"
              >
                Retry Research
              </button>
            )}
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition"
              >
                Back to Search
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 text-slate-900 animate-spin" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-medium text-slate-900">
              Researching "{topic}"
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Clean Minimal Progress Bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-slate-900 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono px-1">
            <span>Progress: Searching → Extracting → Graph</span>
            <span>{progressPercent}%</span>
          </div>
        </>
      )}
    </div>
  );
};
