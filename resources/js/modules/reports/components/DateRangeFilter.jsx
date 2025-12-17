import React from 'react';

export default function DateRangeFilter({ filters, onChange }) {
    return (
        <div className="flex space-x-4 items-end bg-gray-50 p-3 rounded-md border border-gray-200">
            <div>
                <label className="block text-xs font-medium text-gray-700">Desde</label>
                <input
                    type="date"
                    className="mt-1 block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={filters.date_from}
                    onChange={(e) => onChange('date_from', e.target.value)}
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700">Hasta</label>
                <input
                    type="date"
                    className="mt-1 block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={filters.date_to}
                    onChange={(e) => onChange('date_to', e.target.value)}
                />
            </div>
        </div>
    );
}
