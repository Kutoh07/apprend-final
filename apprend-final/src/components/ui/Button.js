import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  className = '' 
}) => {
  const baseClasses = "font-semibold rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg";
  
  const variants = {
    primary: "bg-teal-500 hover:bg-teal-600 text-white",
    secondary: "bg-teal-300 hover:bg-teal-400 text-teal-800",
    danger: "bg-red-500 hover:bg-red-600 text-white",
    outline: "border-2 border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white"
  };
  
  const sizes = {
    small: "py-2 px-4 text-sm",
    medium: "py-4 px-8 text-lg",
    large: "py-4 px-12 text-xl"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''} 
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default Button;