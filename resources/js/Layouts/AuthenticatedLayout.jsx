import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Toaster } from 'react-hot-toast';
import Dropdown from '@/Components/Dropdown';
import ApplicationLogo from '@/Components/ApplicationLogo';
import {
    Bars3Icon,
    XMarkIcon,
    HomeIcon,
    UsersIcon,
    CubeIcon,
    CurrencyDollarIcon,
    ShoppingCartIcon,
    TruckIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    BuildingStorefrontIcon,
    BanknotesIcon,
    DocumentTextIcon,
    WrenchScrewdriverIcon,
    ChevronDownIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline';

export default function AuthenticatedLayout({ header, children }) {
    const { auth, sys_config } = usePage().props;
    const user = auth.user;
    const [showingSidebar, setShowingSidebar] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState(['dashboard']);

    // Helpers for dynamic styles
    const styleVariables = {
        '--color-primary': sys_config?.color_primary || '#4F46E5',
        '--color-secondary': sys_config?.color_secondary || '#1F2937',
    };

    const toggleGroup = (groupId) => {
        if (collapsed) {
            setCollapsed(false);
            setExpandedGroups([groupId]);
            return;
        }
        setExpandedGroups(prev =>
            prev.includes(groupId)
                ? prev.filter(id => id !== groupId)
                : [...prev, groupId]
        );
    };

    const navigationGroups = [
        {
            id: 'dashboard',
            name: 'Dashboard',
            icon: HomeIcon,
            href: '/dashboard',
            single: true,
        },
        {
            id: 'sistema',
            name: 'Sistema',
            icon: Cog6ToothIcon,
            items: [
                { name: 'Usuarios', href: '/seguridad/usuarios' },
            ],
        },
        {
            id: 'rrhh',
            name: 'RRHH',
            icon: UsersIcon,
            items: [
                { name: 'Empleados', href: '/rrhh/empleados' },
                { name: 'Departamentos', href: '/rrhh/departamentos' },
                { name: 'Puestos', href: '/rrhh/puestos' },
            ],
        },
        {
            id: 'inventario',
            name: 'Inventario',
            icon: CubeIcon,
            items: [
                { name: 'Productos', href: '/inventario/productos' },
                { name: 'Categorías', href: '/inventario/categorias' },
                { name: 'Marcas', href: '/inventario/marcas' },
                { name: 'Unidades', href: '/inventario/unidades' },
                { name: 'Kardex', href: '/inventario/kardex' },
                { name: 'Lotes', href: '/inventario/lotes' },
            ],
        },
        {
            id: 'comercial',
            name: 'Comercial',
            icon: BuildingStorefrontIcon,
            items: [
                { name: 'Clientes', href: '/comercial/clientes' },
                { name: 'Proveedores', href: '/comercial/proveedores' },
                { name: 'Cotizaciones', href: '/comercial/cotizaciones' },
            ],
        },
        {
            id: 'operaciones',
            name: 'Operaciones',
            icon: ShoppingCartIcon,
            items: [
                { name: 'POS', href: '/operaciones/pos' },
                { name: 'Ventas', href: '/operaciones/ventas' },
                { name: 'Compras', href: '/operaciones/compras' },
                { name: 'Devoluciones', href: '/operaciones/devoluciones' },
            ],
        },
        {
            id: 'produccion',
            name: 'Producción',
            icon: WrenchScrewdriverIcon,
            items: [
                { name: 'Fórmulas', href: '/produccion/formulas' },
                { name: 'Órdenes', href: '/produccion/ordenes' },
            ],
        },
        {
            id: 'finanzas',
            name: 'Finanzas',
            icon: BanknotesIcon,
            items: [
                { name: 'Gastos', href: '/finanzas/gastos' },
                { name: 'CXC', href: '/finanzas/cxc' },
                { name: 'CXP', href: '/finanzas/cxp' },
            ],
        },
        {
            id: 'contabilidad',
            name: 'Contabilidad',
            icon: DocumentTextIcon,
            items: [
                { name: 'Cuentas', href: '/contabilidad/cuentas' },
                { name: 'Partidas', href: '/contabilidad/partidas' },
            ],
        },
        {
            id: 'tesoreria',
            name: 'Tesorería',
            icon: CurrencyDollarIcon,
            items: [
                { name: 'Cajas', href: '/tesoreria/cajas' },
                { name: 'Sesiones (Caja)', href: '/tesoreria/sesiones' },
                { name: 'Historial Cortes', href: '/tesoreria/historial-cortes' },
            ],
        },
        {
            id: 'logistica',
            name: 'Logística',
            icon: TruckIcon,
            items: [
                { name: 'Bodegas', href: '/logistica/bodegas' },
                { name: 'Traslados', href: '/logistica/traslados' },
            ],
        },
    ];

    const NavItem = ({ item, isChild = false }) => {
        const isActive = window.location.pathname === item.href;

        return (
            <Link
                href={item.href}
                className={`
                    group flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-all duration-150
                    ${isChild ? 'pl-11' : ''}
                    ${isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }
                `}
                title={collapsed ? item.name : ''}
            >
                {!collapsed && item.name}
            </Link>
        );
    };

    const NavGroup = ({ group }) => {
        const isActive = window.location.pathname === group.href; // For single items

        if (group.single) {
            return (
                <Link
                    href={group.href}
                    className={`
                        group flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-all duration-150
                        ${isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}
                        ${collapsed ? 'justify-center' : ''}
                    `}
                    title={collapsed ? group.name : ''}
                >
                    <group.icon className={`${collapsed ? 'h-6 w-6' : 'mr-3 h-5 w-5'} flex-shrink-0`} />
                    {!collapsed && group.name}
                </Link>
            );
        }

        const isExpanded = expandedGroups.includes(group.id);

        return (
            <div>
                <button
                    onClick={() => toggleGroup(group.id)}
                    className={`
                        group w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-2 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-all duration-150
                    `}
                    title={collapsed ? group.name : ''}
                >
                    <div className="flex items-center">
                        <group.icon className={`${collapsed ? 'h-6 w-6' : 'mr-3 h-5 w-5'} flex-shrink-0`} />
                        {!collapsed && group.name}
                    </div>
                    {!collapsed && (
                        isExpanded ? (
                            <ChevronDownIcon className="h-4 w-4" />
                        ) : (
                            <ChevronRightIcon className="h-4 w-4" />
                        )
                    )}
                </button>
                {isExpanded && !collapsed && (
                    <div className="mt-1 space-y-1">
                        {group.items.map((item, index) => (
                            <NavItem key={index} item={item} isChild />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 flex" style={styleVariables}>
            <Toaster position="top-right" />

            {/* Sidebar Desktop */}
            <div
                className={`
                    hidden md:flex md:flex-col md:fixed md:inset-y-0 border-r border-slate-200 bg-white z-30 transition-all duration-300 ease-in-out
                    ${collapsed ? 'md:w-20' : 'md:w-64'}
                `}
            >
                <div className="flex-1 flex flex-col min-h-0">
                    <div
                        className={`flex items-center h-16 flex-shrink-0 px-4 transition-colors ${collapsed ? 'justify-center' : 'justify-between'}`}
                        style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                        {!collapsed && (
                            <div className="flex items-center overflow-hidden">
                                {sys_config?.ruta_logo ? (
                                    <img src={`/storage/${sys_config.ruta_logo}`} className="h-8 w-auto mr-2 object-contain bg-white rounded p-0.5" alt="Logo" />
                                ) : (
                                    <ApplicationLogo className="h-8 w-8 text-white fill-current mr-2" />
                                )}
                                <span className="font-bold text-lg tracking-tight text-white truncate max-w-[150px]" title={sys_config?.nombre_empresa}>
                                    {sys_config?.nombre_empresa || 'ERP'}
                                </span>
                            </div>
                        )}
                        {collapsed && (
                            sys_config?.ruta_logo ? (
                                <img src={`/storage/${sys_config.ruta_logo}`} className="h-8 w-8 object-contain bg-white rounded p-0.5" alt="Logo" />
                            ) : (
                                <ApplicationLogo className="h-8 w-8 text-white fill-current" />
                            )
                        )}

                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="text-white hover:bg-black/20 p-1 rounded focus:outline-none hidden md:block"
                            title={collapsed ? "Expandir menú" : "Contraer menú"}
                        >
                            {collapsed ? <ChevronRightIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
                        <nav className="flex-1 px-3 py-4 space-y-1">
                            {navigationGroups.map((group) => (
                                <NavGroup key={group.id} group={group} />
                            ))}
                        </nav>

                        <div className="px-3 py-4 border-t border-slate-200">
                            <Link
                                href="/configuracion"
                                className={`
                                    group flex items-center px-3 py-2 text-xs font-medium rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900
                                    ${collapsed ? 'justify-center' : ''}
                                `}
                                title="Configuración"
                            >
                                <Cog6ToothIcon className={`${collapsed ? 'h-6 w-6' : 'mr-3 h-5 w-5'} flex-shrink-0`} />
                                {!collapsed && 'Configuración'}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Sidebar */}
            {showingSidebar && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div className="fixed inset-0 bg-slate-600 bg-opacity-75" onClick={() => setShowingSidebar(false)}></div>
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white h-full">
                        <div className="absolute top-0 right-0 -mr-12 pt-2">
                            <button
                                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                onClick={() => setShowingSidebar(false)}
                            >
                                <XMarkIcon className="h-6 w-6 text-white" />
                            </button>
                        </div>
                        <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                            <div className="flex-shrink-0 flex items-center px-4 mb-5">
                                {sys_config?.ruta_logo ? (
                                    <img src={`/storage/${sys_config.ruta_logo}`} className="h-8 w-auto mr-2" alt="Logo" />
                                ) : (
                                    <ApplicationLogo className="h-8 w-auto text-primary-600" />
                                )}
                                <span className="ml-2 text-xl font-bold text-slate-900">{sys_config?.nombre_empresa || 'ERP'}</span>
                            </div>
                            <nav className="px-3 space-y-1">
                                {navigationGroups.map((group) => (
                                    <NavGroup key={group.id} group={group} />
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div
                className={`
                    flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out
                    ${collapsed ? 'md:pl-20' : 'md:pl-64'}
                `}
            >
                {/* Mobile Header */}
                <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white shadow-sm">
                    <button
                        type="button"
                        className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-slate-500 hover:text-slate-900"
                        onClick={() => setShowingSidebar(true)}
                    >
                        <Bars3Icon className="h-6 w-6" />
                    </button>
                </div>

                {/* Top Bar */}
                <div className="flex justify-end items-center h-16 bg-white shadow-sm px-4 md:px-8 border-b border-slate-200">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-500">
                            <span className="font-semibold text-slate-700 uppercase">{user.rol}</span>
                        </span>
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-slate-500 bg-white hover:text-slate-700 transition">
                                    {user.username}
                                    <svg className="ml-2 -mr-0.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content>
                                <Dropdown.Link href={route('profile.edit')}>Perfil</Dropdown.Link>
                                <Dropdown.Link href={route('logout')} method="post" as="button">
                                    Cerrar Sesión
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </div>

                {/* Page Content */}
                <main className="flex-1 py-6 px-4 md:px-8">
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
