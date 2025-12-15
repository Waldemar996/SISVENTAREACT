import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import axios from 'axios';

export default function CreateModal({ isOpen, closeModal, onSuccess, item = null }) {
    const [categories, setCategories] = useState([]);
    const { data, setData, reset, clearErrors } = useForm({ nombre: '', categoria_padre_id: '' });

    useEffect(() => {
        if (isOpen) {
            loadCategories();
            if (item) {
                setData({
                    nombre: item.nombre,
                    categoria_padre_id: item.categoria_padre_id || ''
                });
            } else reset();
            clearErrors();
        }
    }, [isOpen, item]);

    const loadCategories = async () => {
        try {
            const res = await axios.get('/api/inventario/categorias');
            // Filter out itself if editing to avoid loops
            const allCats = res.data.data || res.data;
            if (item) {
                setCategories(allCats.filter(c => c.id !== item.id));
            } else {
                setCategories(allCats);
            }
        } catch (e) { console.error(e); }
    };

    const submit = (e) => {
        e.preventDefault();
        const promise = item
            ? axios.put(`/api/inventario/categorias/${item.id}`, data)
            : axios.post('/api/inventario/categorias', data);

        promise.then(() => { closeModal(); onSuccess(); })
            .catch(err => alert('Error: ' + JSON.stringify(err.response?.data?.errors || err.message)));
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={closeModal}>
                <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                            <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900 dark:text-white mb-4">
                                {item ? 'Editar Categoría' : 'Nueva Categoría'}
                            </Dialog.Title>
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                                    <input type="text" className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        value={data.nombre} onChange={e => setData('nombre', e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría Padre (Opcional)</label>
                                    <select className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        value={data.categoria_padre_id} onChange={e => setData('categoria_padre_id', e.target.value)}>
                                        <option value="">Ninguna (Raíz)</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                    </select>
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
