import { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react'; // Using Inertia useForm for easy submitting
import { XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { useState } from 'react';

export default function CreateModal({ isOpen, closeModal, onSuccess, employee = null }) {
    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);
    const [loadingCatalogs, setLoadingCatalogs] = useState(false);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        codigo_empleado: '',
        nombres: '',
        apellidos: '',
        dpi_identificacion: '',
        email_personal: '',
        telefono: '',
        direccion_residencia: '',
        puesto_id: '',
        salario_base: '',
        fecha_contratacion: new Date().toISOString().split('T')[0],
        estado: 'activo'
    });

    useEffect(() => {
        if (isOpen) {
            loadCatalogs();
            if (employee) {
                setData({
                    codigo_empleado: employee.codigo_empleado,
                    nombres: employee.nombres,
                    apellidos: employee.apellidos,
                    dpi_identificacion: employee.dpi_identificacion,
                    email_personal: employee.email_personal || '',
                    telefono: employee.telefono || '',
                    direccion_residencia: employee.direccion_residencia || '',
                    puesto_id: employee.puesto_id,
                    salario_base: employee.puesto?.salario_base || '', // Default to current salary if not stored in emp
                    fecha_contratacion: employee.fecha_contratacion,
                    estado: employee.estado
                });
            } else {
                reset();
            }
            clearErrors();
        }
    }, [isOpen, employee]);

    const loadCatalogs = async () => {
        setLoadingCatalogs(true);
        try {
            // Parallel requests
            const [deptRes, posRes] = await Promise.all([
                axios.get('/api/rrhh/departamentos'),
                axios.get('/api/rrhh/puestos')
            ]);
            setDepartments(deptRes.data.data || deptRes.data);
            setPositions(posRes.data.data || posRes.data);
        } catch (error) {
            console.error("Error loading catalogs", error);
        } finally {
            setLoadingCatalogs(false);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        if (employee) {
            // Update logic (using axios manually since Inertia router is full page usually, but we want modal)
            // Actually, we can use axios for API SPA feel.
            axios.put(`/api/rrhh/empleados/${employee.id}`, data)
                .then(() => {
                    closeModal();
                    onSuccess();
                })
                .catch(err => {
                    console.error(err);
                    // Handle validation errors manually if using axios
                    if (err.response?.status === 422) {
                        // Map errors to Inertia format if possible or just alert
                        alert('Error de validación: ' + JSON.stringify(err.response.data.errors));
                    }
                });
        } else {
            // Create
            axios.post('/api/rrhh/empleados', data)
                .then(() => {
                    closeModal();
                    onSuccess();
                })
                .catch(err => {
                    console.error(err);
                    if (err.response?.status === 422) {
                        alert('Error de validación: ' + JSON.stringify(err.response.data.errors));
                    }
                });
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={closeModal}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-center mb-6">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-bold leading-6 text-gray-900 dark:text-white"
                                    >
                                        {employee ? 'Editar Empleado' : 'Nuevo Colaborador'}
                                    </Dialog.Title>
                                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                                        <XMarkIcon className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Personal Info */}
                                    <div className="col-span-2">
                                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Información Personal</h4>
                                        <hr className="mb-4 border-gray-200 dark:border-gray-700" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombres</label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            value={data.nombres}
                                            onChange={e => setData('nombres', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Apellidos</label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            value={data.apellidos}
                                            onChange={e => setData('apellidos', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">DPI / Identificación</label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            value={data.dpi_identificacion}
                                            onChange={e => setData('dpi_identificacion', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Personal</label>
                                        <input
                                            type="email"
                                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            value={data.email_personal}
                                            onChange={e => setData('email_personal', e.target.value)}
                                        />
                                    </div>

                                    {/* Job Info */}
                                    <div className="col-span-2 mt-4">
                                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Información Laboral</h4>
                                        <hr className="mb-4 border-gray-200 dark:border-gray-700" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Código Empleado</label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            value={data.codigo_empleado}
                                            onChange={e => setData('codigo_empleado', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Puesto</label>
                                        <select
                                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            value={data.puesto_id}
                                            onChange={e => setData('puesto_id', e.target.value)}
                                            required
                                        >
                                            <option value="">Seleccione un puesto</option>
                                            {positions.map(pos => (
                                                <option key={pos.id} value={pos.id}>{pos.nombre_puesto}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha Contratación</label>
                                        <input
                                            type="date"
                                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            value={data.fecha_contratacion}
                                            onChange={e => setData('fecha_contratacion', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                                        <select
                                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            value={data.estado}
                                            onChange={e => setData('estado', e.target.value)}
                                        >
                                            <option value="activo">Activo</option>
                                            <option value="baja">De Baja</option>
                                            <option value="suspendido">Suspendido</option>
                                        </select>
                                    </div>

                                    <div className="col-span-2 mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                                            onClick={closeModal}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                                            disabled={processing}
                                        >
                                            {employee ? 'Actualizar' : 'Guardar Empleado'}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
