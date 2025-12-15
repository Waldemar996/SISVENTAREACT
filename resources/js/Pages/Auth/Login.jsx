import { useState } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { UserIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export default function Login() {
    const [data, setData] = useState({
        username: '',
        password: '',
        remember: false,
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    const submit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const response = await axios.post('/custom-login', data);

            if (response.data.redirect) {
                window.location.href = response.data.redirect;
            } else {
                window.location.href = '/dashboard';
            }
        } catch (error) {
            console.error(error);
            if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors);
            } else if (error.response && error.response.status === 401) {
                setErrors({ global: error.response.data.message });
            } else {
                setErrors({ global: 'Ocurrió un error inesperado via intentar iniciar sesión.' });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 relative overflow-hidden">
            {/* Ambient Background Elements - Kept Same */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

            <Head title="Acceso al Sistema" />

            <div className="relative z-10 w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                <div className="mb-8 text-center">
                    <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                        <LockClosedIcon className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Sistema ERP</h1>
                    <p className="text-gray-400 text-sm">Bienvenido de nuevo</p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Error Message */}
                    {errors.global && (
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center flex items-center justify-center gap-2">
                            <span>⚠️</span> {errors.global}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Usuario
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserIcon className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                                type="text"
                                value={data.username}
                                onChange={(e) => setData({ ...data, username: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block transition-all placeholder-gray-600"
                                placeholder="admin"
                                required
                                autoFocus
                            />
                        </div>
                        {errors.username && <p className="mt-2 text-sm text-red-400">{errors.username}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Contraseña
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LockClosedIcon className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData({ ...data, password: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block transition-all placeholder-gray-600"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        {errors.password && <p className="mt-2 text-sm text-red-400">{errors.password}</p>}
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) => setData({ ...data, remember: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900 transition-colors"
                            />
                            <span className="ml-2 text-sm text-gray-400 hover:text-gray-300">Recuérdame</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className={`w-full py-3 px-4 flex justify-center items-center rounded-lg text-sm font-semibold text-white transition-all ${processing
                            ? 'bg-blue-600/50 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 active:scale-[0.98]'
                            }`}
                    >
                        {processing ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            'Iniciar Sesión'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>Acceso restringido a personal autorizado</p>
                </div>
            </div>

            {/* Custom Keyframes for Ambient Blobs */}
            <style jsx="true">{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
            `}</style>
        </div>
    );
}
