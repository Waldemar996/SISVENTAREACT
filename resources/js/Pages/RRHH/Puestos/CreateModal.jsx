import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import axios from 'axios';

export default function CreateModal({ isOpen, closeModal, onSuccess, item = null }) {
    const [departments, setDepartments] = useState([]);
    const { data, setData, reset, clearErrors } = useForm({ nombre_puesto: '', departamento_id: '', salario_base: 0, descripcion: '' });

    useEffect(() => {
        if (isOpen) {
            loadDepartments();
            if (item) {
                setData({
                    nombre_puesto: item.nombre_puesto,
                    departamento_id: item.departamento_id,
                    salario_base: item.salario_base,
                    descripcion: item.descripcion || ''
                });
            } else reset();
            clearErrors();
        }
    }, [isOpen, item]);

    const loadDepartments = async () => {
        try {
            const res = await axios.get('/api/rrhh/departamentos');
            setDepartments(res.data.data || res.data);
        } catch (e) { console.error(e); }
    };

    const submit = (e) => {
        e.preventDefault();
        const promise = item
            ? axios.put(`/api/rrhh/puestos/${item.id}`, data)
            : axios.post('/api/rrhh/puestos', data);

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
                                {item ? 'Editar Puesto' : 'Nuevo Puesto'}
                            </Dialog.Title>
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Puesto</label>
                                    <input type="text" className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        value={data.nombre_puesto} onChange={e => setData('nombre_puesto', e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Departamento</label>
                                    <select className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        value={data.departamento_id} onChange={e => setData('departamento_id', e.target.value)} required>
                                        <option value="">Seleccione...</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Salario Base (Q)</label>
                                    <input type="number" step="0.01" className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        value={data.salario_base} onChange={e => setData('salario_base', e.target.value)} required />
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
