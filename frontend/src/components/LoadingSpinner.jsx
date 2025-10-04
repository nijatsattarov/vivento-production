import React from 'react';

const LoadingSpinner = ({ size = "default", text = "Yüklənir..." }) => {
  const sizeClasses = {
    small: "w-6 h-6 border-2",
    default: "w-10 h-10 border-4",
    large: "w-16 h-16 border-4"
  };

  return (
    <div className="loading-spinner">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`${sizeClasses[size]} border-gray-200 border-t-blue-600 rounded-full animate-spin`}></div>
        {text && <p className="text-gray-600 font-medium">{text}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;