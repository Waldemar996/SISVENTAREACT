import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white relative overflow-hidden">
            <Head title="Bienvenido" />

            {/* Ambient Background Elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <header className="px-6 py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
                    <div className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        Sistema ERP
                    </div>
                    <nav>
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="text-sm font-semibold leading-6 text-white hover:text-gray-300 transition"
                            >
                                Ir al Dashboard <span aria-hidden="true">&rarr;</span>
                            </Link>
                        ) : (
                            <Link
                                href={route('login')}
                                className="text-sm font-semibold leading-6 text-white hover:text-gray-300 transition"
                            >
                                Iniciar Sesión <span aria-hidden="true">&rarr;</span>
                            </Link>
                        )}
                    </nav>
                </header>

                <main className="flex-grow flex items-center justify-center px-6">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="mb-8 flex justify-center">
                            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-400 ring-1 ring-white/10 hover:ring-white/20">
                                Versión 1.0.0 <a href="#" className="font-semibold text-blue-400 ml-2"><span className="absolute inset-0" aria-hidden="true" />Novedades <span aria-hidden="true">&rarr;</span></a>
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
                            Gestión Empresarial Inteligente
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-gray-300">
                            Centralice sus operaciones, optimice recursos y tome decisiones informadas con nuestra plataforma integral de gestión.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="rounded-lg bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all active:scale-95"
                                >
                                    Entrar al Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className="rounded-lg bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all active:scale-95"
                                >
                                    Acceder al Sistema
                                </Link>
                            )}
                            <a href="#" className="text-sm font-semibold leading-6 text-white hover:text-gray-300 transition">
                                Soporte Técnico <span aria-hidden="true">→</span>
                            </a>
                        </div>
                    </div>
                </main>

                <footer className="py-8 text-center text-sm text-gray-500">
                    &copy; 2025 Sistema ERP. Todos los derechos reservados.
                </footer>
            </div>
            {/* Styling for animations */}
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
