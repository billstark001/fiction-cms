import React from 'react';

interface ArrowLeftIconProps {
  width?: number;
  height?: number;
  className?: string;
}

const ArrowLeftIcon: React.FC<ArrowLeftIconProps> = ({ 
  width = 16, 
  height = 16, 
  className 
}) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    className={className}
  >
    <polyline points="15,18 9,12 15,6" />
  </svg>
);

export default ArrowLeftIcon;