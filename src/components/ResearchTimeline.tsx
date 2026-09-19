import React from 'react';
import { TimelineEvent } from '../types';

interface ResearchTimelineProps {
  events: TimelineEvent[];
  topic: string;
}

export const ResearchTimeline: React.FC<ResearchTimelineProps> = ({ events, topic }) => {
  if (!events || events.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-slate-400 text-sm">
        No chronological milestones identified in the current corpus.
      </div>
    );
  }

  // Sort chronologically
  const sortedEvents = [...events].sort((a, b) => {
    const yearA = parseInt(a.year, 10) || 2000;
    const yearB = parseInt(b.year, 10) || 2000;
    return yearA - yearB;
  });

  return (
    <div className="max-w-2xl mx-auto py-4">
      <div className="relative border-l border-slate-200 ml-4 md:ml-8 space-y-8 pl-6">
        {sortedEvents.map((event, idx) => (
          <div key={event.id || idx} className="relative group">
            {/* Timeline bullet dot */}
            <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-900 ring-4 ring-white" />

            {/* Content */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-900 font-mono">
                  {event.year}
                </span>
                {event.isApproximate && (
                  <span className="text-[10px] text-slate-400">
                    (approximate)
                  </span>
                )}
              </div>

              <h3 className="text-sm font-medium text-slate-800 leading-snug">
                {event.development}
              </h3>

              {event.sourceTitle && (
                <div className="text-[11px] text-slate-400 italic pt-1">
                  Source: {event.sourceTitle}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
