import { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import axios from 'axios';

export default function CreateModal({ isOpen, closeModal, onSuccess, item = null }) {
    const { data, setData, reset, clearErrors } = useForm({
        razon_social: '', nit: '', nombre_contacto: '', telefono: '', email: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (item) setData({
                razon_social: item.razon_social, nit: item.nit || '',
                nombre_contacto: item.nombre_contacto || '', telefono: item.telefono || '', email: item.email || ''
            });
            else reset();
            clearErrors();
        }
    }, [isOpen, item]);

    const submit = (e) => {
        e.preventDefault();
        const promise = item
            ? axios.put(`/api/comercial/proveedores/${item.id}`, data)
            : axios.post('/api/comercial/proveedores', data);

        promise.then(() => { closeModal(); onSuccess(); })
            .catch(err => alert('Error: ' + JSON.stringify(err.response?.data?.errors || err.message)));
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={closeModal}>
                <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                            <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900 dark:text-white mb-4">
                                {item ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                            </Dialog.Title>
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Razón Social</label>
                                    <input type="text" className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        value={data.razon_social} onChange={e => setData('razon_social', e.target.value)} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">NIT / DPI</label>
                                        <input type="text" className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            value={data.nit} onChange={e => setData('nit', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Contacto</label>
                                        <input type="text" className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            value={data.nombre_contacto} onChange={e => setData('nombre_contacto', e.target.value)} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                                        <input type="text" className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            value={data.telefono} onChange={e => setData('telefono', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                        <input type="email" className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            value={data.email} onChange={e => setData('email', e.target.value)} />
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-end gap-2">
                                    <button type="button" className="btn-secondary px-4 py-2 bg-gray-200 rounded text-gray-800" onClick={closeModal}>Cancelar</button>
                                    <button type="submit" className="btn-primary px-4 py-2 bg-indigo-600 text-white rounded">Guardar</button>
                                </div>
                            </form>
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
