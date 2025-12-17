import React, { forwardRef } from 'react';

// Design System Input
// Supports: label, error message, leading/trailing icons
const Input = forwardRef(({
    label,
    type = 'text',
    name,
    className = '',
    error,
    disabled = false,
    placeholder = '',
    required = false,
    onChange,
    value,
    ...props
}, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                <input
                    ref={ref}
                    type={type}
                    name={name}
                    id={name}
                    className={`
                        block w-full rounded-md shadow-sm sm:text-sm 
                        ${error
                            ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        } 
                        ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}
                        ${className}
                    `}
                    placeholder={placeholder}
                    disabled={disabled}
                    value={value}
                    onChange={onChange}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-xs text-red-600">{error}</p>
            )}
        </div>
    );
});

export default Input;
