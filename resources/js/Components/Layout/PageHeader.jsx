import React from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

/**
 * PageHeader Component - Page title with breadcrumbs and actions
 */
export default function PageHeader({
    title,
    breadcrumbs = [],
    actions,
    description,
    className = ''
}) {
    return (
        <div className={`mb-6 ${className}`}>
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
                <nav className="flex mb-3" aria-label="Breadcrumb">
                    <ol className="inline-flex items-center space-x-1 md:space-x-3">
                        {breadcrumbs.map((crumb, index) => (
                            <li key={index} className="inline-flex items-center">
                                {index > 0 && (
                                    <ChevronRightIcon className="w-4 h-4 text-slate-400 mx-1" />
                                )}
                                {crumb.href ? (
                                    <Link
                                        href={crumb.href}
                                        className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-primary-600"
                                    >
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className="text-sm font-medium text-slate-500">
                                        {crumb.label}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
            )}

            {/* Title and Actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                    {description && (
                        <p className="mt-1 text-sm text-slate-500">{description}</p>
                    )}
                </div>
                {actions && (
                    <div className="flex items-center gap-3">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
