import React from 'react';

interface BritAwardIconProps {
  className?: string;
  title?: string;
}

export const BritAwardIcon: React.FC<BritAwardIconProps> = ({ className = "w-6 h-6", title }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}
      {/* Stylized BRITs statuette / figure */}
      <path d="M12 2C10.62 2 9.5 3.12 9.5 4.5C9.5 5.88 10.62 7 12 7C13.38 7 14.5 5.88 14.5 4.5C14.5 3.12 13.38 2 12 2ZM10 8.5C7.8 8.5 6 10.3 6 12.5V14H8V21C8 21.55 8.45 22 9 22H15C15.55 22 16 21.55 16 21V14H18V12.5C18 10.3 16.2 8.5 14 8.5H10ZM11 14H13V20H11V14ZM8.5 11C8.5 10.17 9.17 9.5 10 9.5H14C14.83 9.5 15.5 10.17 15.5 11V12.5H8.5V11Z" />
    </svg>
  );
};

export default BritAwardIcon;
