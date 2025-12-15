import React from 'react';

/**
 * EmptyState Component - Display when no data is available
 */
export default function EmptyState({
    title = 'No hay datos',
    description = 'No se encontraron registros para mostrar.',
    icon: Icon,
    action,
    className = ''
}) {
    return (
        <div className={`text-center py-12 ${className}`}>
            {Icon && (
                <Icon className="mx-auto h-12 w-12 text-slate-400" />
            )}
            <h3 className="mt-2 text-sm font-medium text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
            {action && (
                <div className="mt-6">
                    {action}
                </div>
            )}
        </div>
    );
}
