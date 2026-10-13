import React from 'react';

export const GoldenGlobeAwardIcon: React.FC<{ className?: string; title?: string }> = ({ className = "w-6 h-6", title }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {title && <title>{title}</title>}
    {/* Globe sphere */}
    <circle cx="12" cy="7.5" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M7.5 7.5H16.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <ellipse cx="12" cy="7.5" rx="2.5" ry="5" stroke="currentColor" strokeWidth="1.2" />
    {/* Pedestal / Base */}
    <path d="M12 12.5V18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M9 18H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M7 21H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Laurel leaves left and right */}
    <path d="M5.5 13.5C5 11 5 8.5 6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M18.5 13.5C19 11 19 8.5 18 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export default GoldenGlobeAwardIcon;
