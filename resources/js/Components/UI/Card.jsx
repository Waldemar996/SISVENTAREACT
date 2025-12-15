import React from 'react';

/**
 * Card Component - Container with shadow and padding
 */
export default function Card({ children, className = '', padding = 'default', ...props }) {
    const paddings = {
        none: '',
        sm: 'p-3 sm:p-4',
        default: 'p-4 sm:p-6',
        lg: 'p-6 sm:p-8',
    };

    return (
        <div
            className={`bg-white rounded-lg shadow-sm border border-slate-200 ${paddings[padding]} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
