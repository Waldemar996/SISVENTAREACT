import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import Button from '@/Components/UI/Button';
import Input from '@/Components/UI/Input';
import { PhotoIcon, SwatchIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

export default function ConfigurationIndex({ auth }) {
    // Get initial config from shared props or API (here relying on shared prop updated in Middleware)
    const { sys_config } = usePage().props;

    const [activeTab, setActiveTab] = useState('general');

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        nombre_empresa: sys_config?.nombre_empresa || '',
        nit_empresa: sys_config?.nit_empresa || '',
        direccion_fiscal: sys_config?.direccion_fiscal || '',
        moneda_simbolo: sys_config?.moneda_simbolo || 'Q',
        email_contacto: sys_config?.email_contacto || '',
        website: sys_config?.website || '',
        color_primary: sys_config?.color_primary || '#4F46E5',
        color_secondary: sys_config?.color_secondary || '#1F2937',
        logo: null,
    });

    const [logoPreview, setLogoPreview] = useState(sys_config?.ruta_logo ? `/storage/${sys_config.ruta_logo}` : null);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Use post with _method: 'put' handled by backend router or just post to update
        post('/api/configuracion', {
            forceFormData: true,
            onSuccess: () => {
                // Force a reload to apply new theme settings if they changed
                window.location.reload();
            }
        });
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('logo', file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Configuración del Sistema" />

            <div className="flex">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuración del Sistema</h1>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden flex flex-col md:flex-row min-h-[500px]">
                {/* Sidebar Tabs */}
                <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`w-full flex items-center px-6 py-4 text-left font-medium transition-colors ${activeTab === 'general' ? 'bg-white text-indigo-600 border-l-4 border-indigo-600' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <BuildingOfficeIcon className="h-5 w-5 mr-3" />
                        Información General
                    </button>
                    <button
                        onClick={() => setActiveTab('apariencia')}
                        className={`w-full flex items-center px-6 py-4 text-left font-medium transition-colors ${activeTab === 'apariencia' ? 'bg-white text-indigo-600 border-l-4 border-indigo-600' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <SwatchIcon className="h-5 w-5 mr-3" />
                        Apariencia y Tema
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8">
                    <form onSubmit={handleSubmit}>
                        {activeTab === 'general' && (
                            <div className="space-y-6 max-w-2xl animate-in fade-in duration-300">
                                <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Datos de la Empresa</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Logo de la Empresa</label>
                                        <div className="mt-2 flex items-center space-x-6">
                                            <div className="h-24 w-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative bg-gray-50">
                                                {logoPreview ? (
                                                    <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                                                ) : (
                                                    <PhotoIcon className="h-8 w-8 text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleLogoChange}
                                                    className="block w-full text-sm text-gray-500
                                                        file:mr-4 file:py-2 file:px-4
                                                        file:rounded-full file:border-0
                                                        file:text-sm file:font-semibold
                                                        file:bg-indigo-50 file:text-indigo-700
                                                        hover:file:bg-indigo-100"
                                                />
                                                <p className="mt-1 text-xs text-gray-500">PNG, JPG, max 2MB.</p>
                                                {errors.logo && <div className="text-red-500 text-xs mt-1">{errors.logo}</div>}
                                            </div>
                                        </div>
                                    </div>

                                    <Input
                                        label="Nombre de la Empresa"
                                        value={data.nombre_empresa}
                                        onChange={e => setData('nombre_empresa', e.target.value)}
                                        error={errors.nombre_empresa}
                                    />

                                    <Input
                                        label="NIT / RUC"
                                        value={data.nit_empresa}
                                        onChange={e => setData('nit_empresa', e.target.value)}
                                        error={errors.nit_empresa}
                                    />

                                    <div className="col-span-2">
                                        <Input
                                            label="Dirección Fiscal"
                                            value={data.direccion_fiscal}
                                            onChange={e => setData('direccion_fiscal', e.target.value)}
                                            error={errors.direccion_fiscal}
                                        />
                                    </div>

                                    <Input
                                        label="Símbolo Moneda"
                                        value={data.moneda_simbolo}
                                        onChange={e => setData('moneda_simbolo', e.target.value)}
                                        error={errors.moneda_simbolo}
                                    />

                                    <Input
                                        label="Email Contacto"
                                        type="email"
                                        value={data.email_contacto}
                                        onChange={e => setData('email_contacto', e.target.value)}
                                        error={errors.email_contacto}
                                    />

                                    <Input
                                        label="Sitio Web"
                                        value={data.website}
                                        onChange={e => setData('website', e.target.value)}
                                        error={errors.website}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'apariencia' && (
                            <div className="space-y-6 max-w-2xl animate-in fade-in duration-300">
                                <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Personalización del Sistema</h2>
                                <p className="text-sm text-gray-500">Seleccione los colores principales. Estos cambios se aplicarán a toda la interfaz.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Color Primario</label>
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="color"
                                                value={data.color_primary}
                                                onChange={e => setData('color_primary', e.target.value)}
                                                className="h-12 w-20 p-1 rounded border border-gray-300 cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={data.color_primary}
                                                onChange={e => setData('color_primary', e.target.value)}
                                                className="uppercase rounded border-gray-300 w-28"
                                            />
                                        </div>
                                        {errors.color_primary && <div className="text-red-500 text-xs mt-1">{errors.color_primary}</div>}
                                        <p className="text-xs text-gray-500 mt-2">Usado en barra lateral, botones principales y encabezados.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Color Secundario</label>
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="color"
                                                value={data.color_secondary}
                                                onChange={e => setData('color_secondary', e.target.value)}
                                                className="h-12 w-20 p-1 rounded border border-gray-300 cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={data.color_secondary}
                                                onChange={e => setData('color_secondary', e.target.value)}
                                                className="uppercase rounded border-gray-300 w-28"
                                            />
                                        </div>
                                        {errors.color_secondary && <div className="text-red-500 text-xs mt-1">{errors.color_secondary}</div>}
                                        <p className="text-xs text-gray-500 mt-2">Usado en textos oscuros, menús secundarios y pies de página.</p>
                                    </div>
                                </div>

                                <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                                    <h3 className="text-sm font-bold text-gray-700 mb-4">Vista Previa</h3>
                                    <div className="space-y-4">
                                        <div
                                            className="h-12 w-full rounded flex items-center justify-between px-4 text-white shadow-md"
                                            style={{ backgroundColor: data.color_primary }}
                                        >
                                            <span className="font-bold">Encabezado / Navbar</span>
                                            <span className="text-sm opacity-80">Usuario</span>
                                        </div>

                                        <div className="flex space-x-4">
                                            <button
                                                type="button"
                                                className="px-4 py-2 rounded text-white font-medium shadow"
                                                style={{ backgroundColor: data.color_primary }}
                                            >
                                                Botón Primario
                                            </button>
                                            <button
                                                type="button"
                                                className="px-4 py-2 rounded text-white font-medium shadow"
                                                style={{ backgroundColor: data.color_secondary }}
                                            >
                                                Botón Secundario
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 flex justify-end pt-5 border-t border-gray-200">
                            <Button type="submit" disabled={processing} className="w-full md:w-auto">
                                {processing ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </div>

                        {recentlySuccessful && (
                            <div className="mt-3 text-sm text-green-600 font-medium text-right">
                                ¡Configuración guardada exitosamente!
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
