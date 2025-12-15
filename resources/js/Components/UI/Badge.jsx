import React from 'react';

/**
 * Badge Component - Status indicators
 * Variants: success, warning, danger, info, default
 */
export default function Badge({ children, variant = 'default', size = 'md', className = '' }) {
    const baseStyles = 'inline-flex items-center font-medium rounded-full';

    const variants = {
        primary: 'bg-primary-100 text-primary-800 border-primary-200',
        secondary: 'bg-secondary-100 text-secondary-800 border-secondary-200',
        success: 'bg-success-100 text-success-800 border-success-200',
        warning: 'bg-warning-100 text-warning-800 border-warning-200',
        danger: 'bg-danger-100 text-danger-800 border-danger-200',
        info: 'bg-info-100 text-info-800 border-info-200',
        default: 'bg-secondary-100 text-secondary-600 border-secondary-200',
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-sm',
        lg: 'px-3 py-1 text-base',
    };

    return (
        <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}>
            {children}
        </span>
    );
}
