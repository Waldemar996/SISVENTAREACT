import React from 'react';

/**
 * Input Component - Form input with label and error support
 */
export default function Input({
    label,
    error,
    type = 'text',
    className = '',
    required = false,
    ...props
}) {
    const inputStyles = `
        block w-full rounded-lg border-slate-300 shadow-sm
        focus:border-primary-500 focus:ring-primary-500
        disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
        ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
        ${className}
    `;

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                type={type}
                className={inputStyles}
                {...props}
            />
            {error && (
                <p className="mt-1.5 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}
