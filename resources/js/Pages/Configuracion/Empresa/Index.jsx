import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    BuildingOfficeIcon, MapPinIcon, PhoneIcon,
    EnvelopeIcon, IdentificationIcon
} from '@heroicons/react/24/outline';
import PageHeader from '@/Components/Layout/PageHeader';
import Card from '@/Components/UI/Card';
import Button from '@/Components/UI/Button';
import Input from '@/Components/UI/Input';
import LoadingSpinner from '@/Components/UI/LoadingSpinner';

export default function Index({ auth }) {
    const [empresa, setEmpresa] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        razon_social: '',
        nombre_comercial: '',
        nit: '',
        direccion: '',
        telefono: '',
        email: '',
        sitio_web: '',
        representante_legal: '',
        regimen_tributario: 'general',
        moneda_base: 'GTQ',
        logo_url: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get('/api/configuracion/empresa');
            if (response.data) {
                setEmpresa(response.data);
                setFormData(response.data);
            }
        } catch (error) {
            console.log('No hay configuración de empresa');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        try {
            if (empresa) {
                await axios.put(`/api/configuracion/empresa/${empresa.id}`, formData);
                toast.success('Configuración actualizada correctamente');
            } else {
                await axios.post('/api/configuracion/empresa', formData);
                toast.success('Configuración creada correctamente');
            }
            fetchData();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error('Error al guardar configuración');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Configuración de Empresa" />

            <PageHeader
                title="Configuración de Empresa"
                breadcrumbs={[
                    { label: 'Configuración', href: route('dashboard') },
                    { label: 'Empresa' }
                ]}
            />

            {loading ? (
                <Card>
                    <LoadingSpinner className="py-12" />
                </Card>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Información General */}
                    <Card>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-primary-100 rounded-full">
                                <BuildingOfficeIcon className="h-6 w-6 text-primary-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-secondary-900">Información General</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <Input
                                label="Razón Social"
                                required
                                value={formData.razon_social}
                                onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                                error={errors.razon_social?.[0]}
                                placeholder="Empresa S.A."
                            />
                            <Input
                                label="Nombre Comercial"
                                value={formData.nombre_comercial}
                                onChange={(e) => setFormData({ ...formData, nombre_comercial: e.target.value })}
                                error={errors.nombre_comercial?.[0]}
                                placeholder="Mi Empresa"
                            />
                            <Input
                                label="NIT"
                                required
                                value={formData.nit}
                                onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                                error={errors.nit?.[0]}
                                placeholder="12345678-9"
                            />
                            <Input
                                label="Representante Legal"
                                value={formData.representante_legal}
                                onChange={(e) => setFormData({ ...formData, representante_legal: e.target.value })}
                                error={errors.representante_legal?.[0]}
                                placeholder="Nombre del representante"
                            />
                        </div>
                    </Card>

                    {/* Información de Contacto */}
                    <Card>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-info-100 rounded-full">
                                <PhoneIcon className="h-6 w-6 text-info-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-secondary-900">Información de Contacto</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-secondary-700 mb-1.5">Dirección</label>
                                <textarea
                                    value={formData.direccion}
                                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                    rows={3}
                                    className="block w-full rounded-lg border-secondary-300"
                                    placeholder="Dirección completa de la empresa..."
                                />
                            </div>
                            <Input
                                label="Teléfono"
                                value={formData.telefono}
                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                error={errors.telefono?.[0]}
                                placeholder="2222-2222"
                            />
                            <Input
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                error={errors.email?.[0]}
                                placeholder="contacto@empresa.com"
                            />
                            <Input
                                label="Sitio Web"
                                value={formData.sitio_web}
                                onChange={(e) => setFormData({ ...formData, sitio_web: e.target.value })}
                                error={errors.sitio_web?.[0]}
                                placeholder="https://www.empresa.com"
                            />
                        </div>
                    </Card>

                    {/* Configuración Tributaria */}
                    <Card>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-warning-100 rounded-full">
                                <IdentificationIcon className="h-6 w-6 text-warning-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-secondary-900">Configuración Tributaria y Contable</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                                    Régimen Tributario
                                </label>
                                <select
                                    value={formData.regimen_tributario}
                                    onChange={(e) => setFormData({ ...formData, regimen_tributario: e.target.value })}
                                    className="block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                >
                                    <option value="general">Régimen General</option>
                                    <option value="pequeño_contribuyente">Pequeño Contribuyente</option>
                                    <option value="opcional">Opcional Simplificado</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                                    Moneda Base
                                </label>
                                <select
                                    value={formData.moneda_base}
                                    onChange={(e) => setFormData({ ...formData, moneda_base: e.target.value })}
                                    className="block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                >
                                    <option value="GTQ">Quetzales (GTQ)</option>
                                    <option value="USD">Dólares (USD)</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    {/* Logo */}
                    <Card>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-success-100 rounded-full">
                                <BuildingOfficeIcon className="h-6 w-6 text-success-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-secondary-900">Logo de la Empresa</h2>
                        </div>

                        <Input
                            label="URL del Logo"
                            value={formData.logo_url}
                            onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                            error={errors.logo_url?.[0]}
                            placeholder="https://ejemplo.com/logo.png"
                        />

                        {formData.logo_url && (
                            <div className="mt-4">
                                <p className="text-sm text-secondary-600 mb-2">Vista previa:</p>
                                <img
                                    src={formData.logo_url}
                                    alt="Logo"
                                    className="h-24 object-contain border border-secondary-200 rounded-lg p-2"
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                            </div>
                        )}
                    </Card>

                    {/* Botones de Acción */}
                    <div className="flex justify-end gap-4">
                        <Button type="submit" loading={saving}>
                            {empresa ? 'Guardar Cambios' : 'Crear Configuración'}
                        </Button>
                    </div>
                </form>
            )}
        </AuthenticatedLayout>
    );
}
