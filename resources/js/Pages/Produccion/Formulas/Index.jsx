import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PlusIcon, WrenchScrewdriverIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/Components/Layout/PageHeader';
import Card from '@/Components/UI/Card';
import Button from '@/Components/UI/Button';
import SearchBar from '@/Components/UI/SearchBar';
import Badge from '@/Components/UI/Badge';
import Modal from '@/Components/UI/Modal';
import Input from '@/Components/UI/Input';
import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import EmptyState from '@/Components/UI/EmptyState';

export default function Index({ auth }) {
    const [formulas, setFormulas] = useState([]);
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedFormula, setSelectedFormula] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        producto_id: '',
        cantidad_producir: 1,
        componentes: []
    });

    const [errors, setErrors] = useState({});

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [formRes, prodRes] = await Promise.all([
                axios.get('/api/produccion/formulas'),
                axios.get('/api/inventario/productos')
            ]);
            setFormulas(formRes.data.data || formRes.data);
            setProductos(prodRes.data.data || prodRes.data);
        } catch (error) {
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setFormData({
            producto_id: '',
            cantidad_producir: 1,
            componentes: [{ producto_componente_id: '', cantidad_necesaria: 1 }]
        });
        setErrors({});
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        try {
            await axios.post('/api/produccion/formulas', formData);
            toast.success('Fórmula creada correctamente');
            setModalOpen(false);
            fetchData();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error('Error al crear fórmula');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar esta fórmula?')) return;
        try {
            await axios.delete(`/api/produccion/formulas/${id}`);
            toast.success('Fórmula eliminada');
            fetchData();
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    const addComponente = () => {
        setFormData({
            ...formData,
            componentes: [...formData.componentes, { producto_componente_id: '', cantidad_necesaria: 1 }]
        });
    };

    const removeComponente = (index) => {
        setFormData({
            ...formData,
            componentes: formData.componentes.filter((_, i) => i !== index)
        });
    };

    const updateComponente = (index, field, value) => {
        const newComponentes = [...formData.componentes];
        newComponentes[index][field] = value;
        setFormData({ ...formData, componentes: newComponentes });
    };

    const filteredFormulas = formulas.filter(f =>
        f.producto?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Fórmulas - Producción" />

            <PageHeader
                title="Fórmulas de Producción (BOM)"
                breadcrumbs={[
                    { label: 'Producción', href: route('produccion.formulas') },
                    { label: 'Fórmulas' }
                ]}
                actions={
                    <Button onClick={handleOpenModal}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nueva Fórmula
                    </Button>
                }
            />

            <Card>
                <div className="mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar fórmula..."
                        className="max-w-md"
                    />
                </div>

                {loading ? (
                    <LoadingSpinner className="py-12" />
                ) : filteredFormulas.length === 0 ? (
                    <EmptyState
                        icon={WrenchScrewdriverIcon}
                        title="No hay fórmulas"
                        description="Crea fórmulas para definir cómo se producen tus productos"
                        action={
                            <Button onClick={handleOpenModal}>
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Crear Fórmula
                            </Button>
                        }
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredFormulas.map((formula) => (
                            <Card key={formula.id} padding="default" className="hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-slate-900">{formula.producto?.nombre}</h3>
                                        <p className="text-sm text-slate-500 mt-1">Cantidad: {formula.cantidad_producir}</p>
                                    </div>
                                    <Badge variant="primary">{formula.componentes_count || 0} componentes</Badge>
                                </div>
                                <div className="border-t border-slate-200 pt-3 mt-3">
                                    <p className="text-xs font-medium text-slate-600 mb-2">Componentes:</p>
                                    <div className="space-y-1">
                                        {formula.componentes?.slice(0, 3).map((comp, idx) => (
                                            <div key={idx} className="text-xs text-slate-500">
                                                • {comp.producto_componente?.nombre || comp.producto_hijo?.nombre} ({Number(comp.cantidad_requerida)})
                                            </div>
                                        ))}
                                        {formula.componentes?.length > 3 && (
                                            <div className="text-xs text-slate-400">+ {formula.componentes.length - 3} más...</div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <Button size="sm" variant="secondary" className="flex-1" onClick={() => setSelectedFormula(formula)}>
                                        <EyeIcon className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="danger" onClick={() => handleDelete(formula.id)} className="flex-1">
                                        <TrashIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </Card>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Nueva Fórmula de Producción"
                size="xl"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} loading={saving}>Crear Fórmula</Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Producto a Producir <span className="text-red-500">*</span></label>
                            <select required value={formData.producto_id}
                                onChange={(e) => setFormData({ ...formData, producto_id: e.target.value })}
                                className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                                <option value="">Seleccione Producto</option>
                                {productos.map(prod => (
                                    <option key={prod.id} value={prod.id}>{prod.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <Input label="Cantidad a Producir" type="number" min="1" required value={formData.cantidad_producir}
                            onChange={(e) => setFormData({ ...formData, cantidad_producir: e.target.value })} />
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-slate-900">Componentes (Materias Primas)</h3>
                            <Button type="button" size="sm" onClick={addComponente}>
                                <PlusIcon className="h-4 w-4 mr-1" />Agregar Componente
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {formData.componentes.map((comp, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-8">
                                        <select value={comp.producto_componente_id}
                                            onChange={(e) => updateComponente(index, 'producto_componente_id', e.target.value)}
                                            className="block w-full rounded-lg border-slate-300 text-sm">
                                            <option value="">Seleccione Componente</option>
                                            {productos.map(prod => (
                                                <option key={prod.id} value={prod.id}>{prod.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-3">
                                        <input type="number" min="0.01" step="0.01" value={comp.cantidad_necesaria}
                                            onChange={(e) => updateComponente(index, 'cantidad_necesaria', e.target.value)}
                                            className="block w-full rounded-lg border-slate-300 text-sm" placeholder="Cantidad" />
                                    </div>
                                    <div className="col-span-1">
                                        <Button type="button" size="sm" variant="danger" onClick={() => removeComponente(index)}>
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Modal Detalle */}
            <Modal
                isOpen={!!selectedFormula}
                onClose={() => setSelectedFormula(null)}
                title={`Detalles de Fórmula: ${selectedFormula?.producto?.nombre}`}
                size="lg"
            >
                {selectedFormula && (
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-slate-700 mb-2">Producto Terminado</h4>
                            <p className="text-xl font-bold text-slate-900">{selectedFormula.producto?.nombre}</p>
                            <p className="text-sm text-slate-500">Cantidad Base: {selectedFormula.cantidad_producir}</p>
                        </div>

                        <div>
                            <h4 className="font-semibold text-slate-700 mb-2">Ingredientes Requeridos</h4>
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Insumo</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Cantidad</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Costo Est.</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {selectedFormula.componentes?.map((comp, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-2 text-sm text-slate-900">
                                                {comp.producto_hijo?.nombre}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-right font-mono">
                                                {Number(comp.cantidad_requerida)}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-right text-slate-500">
                                                --
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button variant="secondary" onClick={() => setSelectedFormula(null)}>Cerrar</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
