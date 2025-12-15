import React, { useState, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

export default function SearchableSelect({
    items = [],
    selectedId,
    onChange,
    label,
    placeholder = "Buscar...",
    displayKey = 'nombre',
    secondaryKey = 'codigo_sku',
    disabled = false
}) {
    const [query, setQuery] = useState('');

    const selectedItem = items.find(item => item.id == selectedId) || null;

    const filteredItems = query === ''
        ? items
        : items.filter((item) => {
            const display = item[displayKey]?.toLowerCase() || '';
            const secondary = item[secondaryKey]?.toLowerCase() || '';
            const q = query.toLowerCase();
            return display.includes(q) || secondary.includes(q);
        });

    return (
        <div className="w-full">
            {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
            <Combobox value={selectedItem} onChange={(item) => onChange(item ? item.id : null)} disabled={disabled}>
                <div className="relative mt-1">
                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-slate-300 shadow-sm focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 sm:text-sm">
                        <Combobox.Input
                            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 disabled:bg-slate-100 placeholder:text-slate-400"
                            displayValue={(item) => item ? item[displayKey] : ''}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={placeholder}
                        />
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </Combobox.Button>
                    </div>
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        afterLeave={() => setQuery('')}
                    >
                        <Combobox.Options className="absolute mt-1 max-h-80 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-[9999]">
                            {filteredItems.length === 0 && query !== '' ? (
                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                    No se encontraron resultados.
                                </div>
                            ) : (
                                filteredItems.map((item) => (
                                    <Combobox.Option
                                        key={item.id}
                                        className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-primary-600 text-white' : 'text-gray-900'
                                            }`
                                        }
                                        value={item}
                                    >
                                        {({ selected, active }) => (
                                            <>
                                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                    {item[displayKey]}
                                                    {item[secondaryKey] && <span className={`ml-2 text-xs ${active ? 'text-primary-200' : 'text-slate-500'}`}>({item[secondaryKey]})</span>}
                                                </span>
                                                {selected ? (
                                                    <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-primary-600'}`}>
                                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                    </span>
                                                ) : null}
                                            </>
                                        )}
                                    </Combobox.Option>
                                ))
                            )}
                        </Combobox.Options>
                    </Transition>
                </div>
            </Combobox>
            {/* Debug (Hidden): Current ID: {selectedId} */}
        </div>
    );
}
