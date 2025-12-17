import { useState } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { UserIcon, LockClosedIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';

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
                setErrors({ global: 'Ocurrió un error inesperado al intentar iniciar sesión.' });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
            {/* Elegant Light Background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 via-white to-indigo-50/50 z-0"></div>

            {/* Abstract Corporate Shapes */}
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[80px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-[100px] animate-pulse-slow delay-700"></div>

            <Head title="Acceso Corporativo" />

            <div className="relative z-10 w-full max-w-sm md:max-w-md bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10 transition-all duration-300 hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)]">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-500/20 mb-5">
                        <BuildingOffice2Icon className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                        Sistema ERP
                    </h1>
                    <p className="text-slate-500 text-sm mt-2">Gestión Empresarial Inteligente</p>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    {errors.global && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium text-center animate-shake flex items-center justify-center gap-2">
                            <span className="font-bold">⚠️</span> {errors.global}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="group">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                                Usuario
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <UserIcon className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={data.username}
                                    onChange={(e) => setData({ ...data, username: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block transition-all placeholder-slate-400 font-medium"
                                    placeholder="Ingrese usuario..."
                                    required
                                    autoFocus
                                />
                            </div>
                            {errors.username && <p className="mt-1 text-xs text-red-500 pl-1 font-medium">{errors.username}</p>}
                        </div>

                        <div className="group">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                                Contraseña
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <LockClosedIcon className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData({ ...data, password: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block transition-all placeholder-slate-400 font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            {errors.password && <p className="mt-1 text-xs text-red-500 pl-1 font-medium">{errors.password}</p>}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center cursor-pointer group">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData({ ...data, remember: e.target.checked })}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors cursor-pointer"
                                />
                                <span className="ml-2 text-sm text-slate-500 group-hover:text-slate-700 transition-colors">Recordarme</span>
                            </div>
                        </label>
                        <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                            ¿Necesitas ayuda?
                        </a>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className={`w-full py-3.5 px-6 rounded-xl text-sm font-bold text-white shadow-lg transition-all transform duration-200 ${processing
                            ? 'bg-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]'
                            }`}
                    >
                        {processing ? (
                            <div className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Autenticando...</span>
                            </div>
                        ) : (
                            'Iniciar Sesión'
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400 font-medium">
                        &copy; {new Date().getFullYear()} Plataforma Segura. v2.1
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes pulse-slow {
                    0%, 100% { transform: scale(1); opacity: 0.3; }
                    50% { transform: scale(1.05); opacity: 0.5; }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
                    20%, 40%, 60%, 80% { transform: translateX(2px); }
                }
                .animate-shake {
                    animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
                }
            `}</style>
        </div>
    );
}
