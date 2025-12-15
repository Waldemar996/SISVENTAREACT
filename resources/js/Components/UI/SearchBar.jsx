import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';

/**
 * SearchBar Component - Search input with icon
 */
export default function SearchBar({ value, onChange, placeholder = 'Buscar...', className = '', loading = false }) {
    return (
        <div className={`relative ${className}`}>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                {loading ? (
                    <LoadingSpinner className="h-5 w-5 text-primary-500" />
                ) : (
                    <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                )}
            </div>
            <input
                type="text"
                value={value}
                onChange={onChange}
                className="block w-full rounded-lg border-slate-300 pl-10 pr-3 py-2 text-sm placeholder:text-slate-400 focus:border-primary-500 focus:ring-primary-500"
                placeholder={placeholder}
            />
        </div>
    );
}
