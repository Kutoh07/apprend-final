import React from 'react';

const Input = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  required = false,
  error = null,
  icon = null 
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700 block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`
            w-full p-4 bg-gray-50 border rounded-2xl 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
            transition-all
            ${error ? 'border-red-300' : 'border-gray-200'}
            ${icon ? 'pr-12' : ''}
          `}
        />
        {icon && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
};

export default Input;