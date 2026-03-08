import React from 'react';

const LoadingSpinner = ({ size = "lg" }) => {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[200px]">
      <div className={`loading loading-spinner loading-${size}`}></div>
    </div>
  );
};

export default LoadingSpinner;
