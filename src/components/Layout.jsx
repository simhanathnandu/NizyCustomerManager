import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Receipt, Menu, X, Scissors, ChevronDown, Plus, List, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import clsx from 'clsx';

export default function Layout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const NavItem = ({ to, icon: Icon, label, children }) => {
        const isActive = location.pathname.startsWith(to);
        const [isHovered, setIsHovered] = useState(false);

        return (
            <div
                className="relative group h-full flex items-center"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <Link
                    to={to}
                    className={clsx(
                        "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                        isActive
                            ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30"
                            : "text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                >
                    <Icon className={clsx("h-4 w-4 mr-2", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400")} />
                    {label}
                    {children && <ChevronDown className={clsx("h-3 w-3 ml-1.5 transition-transform duration-200", isHovered ? "rotate-180" : "")} />}
                </Link>

                {children && isHovered && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 z-50 animate-in fade-in slide-in-from-top-1">
                        {children}
                    </div>
                )}
            </div>
        );
    };

    const DropdownItem = ({ to, label, icon: Icon, state }) => (
        <Link
            to={to}
            state={state}
            className="flex items-center px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
            {Icon && <Icon className="h-4 w-4 mr-2 opacity-70" />}
            {label}
        </Link>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans transition-colors duration-200">
            {/* Top Navigation Bar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-sm h-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
                    <div className="flex justify-between items-center h-full">
                        {/* Logo */}
                        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
                            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-200 text-white transform transition-transform hover:scale-105">
                                <Scissors className="h-5 w-5" />
                            </div>
                            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-violet-700">
                                Nizy Fashion
                            </span>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-2 h-full">
                            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />

                            <NavItem to="/customers" icon={Users} label="Customers">
                                <DropdownItem to="/customers" label="View All" icon={List} />
                                <DropdownItem to="/customers" state={{ openAddModal: true }} label="Add New Customer" icon={Plus} />
                            </NavItem>

                            <NavItem to="/billing" icon={Receipt} label="Billing">
                                <DropdownItem to="/billing" label="View All Orders" icon={List} />
                                <DropdownItem to="/billing" state={{ openAddModal: true }} label="Create New Bill" icon={Plus} />
                            </NavItem>

                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>

                            <button
                                onClick={toggleTheme}
                                className="flex items-center px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                            >
                                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                            </button>

                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>

                            <button
                                onClick={handleLogout}
                                className="flex items-center px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Navigation Drawer */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
                    <div className="fixed inset-y-0 right-0 w-64 bg-white dark:bg-slate-800 shadow-2xl p-6 transform transition-transform duration-300 ease-in-out">
                        <div className="flex flex-col space-y-4 mt-12">
                            <Link to="/" className="flex items-center px-4 py-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-medium">
                                <LayoutDashboard className="h-5 w-5 mr-3" />
                                Dashboard
                            </Link>
                            <div className="space-y-1">
                                <div className="px-4 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Parameters</div>
                                <Link to="/customers" className="flex items-center px-4 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium">
                                    <Users className="h-5 w-5 mr-3" />
                                    Customers
                                </Link>
                                <Link to="/billing" className="flex items-center px-4 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium">
                                    <Receipt className="h-5 w-5 mr-3" />
                                    Billing
                                </Link>
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-4 space-y-2">
                                <button
                                    onClick={toggleTheme}
                                    className="flex w-full items-center px-4 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium"
                                >
                                    {theme === 'light' ? <Moon className="h-5 w-5 mr-3" /> : <Sun className="h-5 w-5 mr-3" />}
                                    {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center px-4 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 font-medium"
                                >
                                    <LogOut className="h-5 w-5 mr-3" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-in fade-in duration-500">
                <div className="bg-white/0">
                    {/* The bg-white/0 is a placeholder, pages provide their own cards */}
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
