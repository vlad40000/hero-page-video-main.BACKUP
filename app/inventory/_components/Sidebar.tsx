
import React from 'react';
import {
    LayoutDashboard,
    Package,
    PackageSearch,
    Zap,
    Copy,
    Plus,
    Globe,
    X,
    Settings,
    Database,
    ChevronRight
} from 'lucide-react';
import { AppView } from '@/lib/inventory-types';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
    currentView: AppView;
    onViewChange: (view: AppView) => void;
    onOpenAddModal: () => void;
    onOpenConnectModal: () => void;
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    currentView,
    onViewChange,
    onOpenAddModal,
    onOpenConnectModal,
    isOpen = false,
    onClose
}) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'inventory', label: 'Inventory', icon: Package },
        { id: 'partsCatalog', label: 'Parts Catalog', icon: PackageSearch },
        { id: 'generator', label: 'AI Generator', icon: Zap },
        { id: 'sidecar', label: 'Sidecar', icon: Copy },
    ];

    const bottomNavItems = [
        { id: 'settings', label: 'Settings', icon: Settings },
        { id: 'database', label: 'Database', icon: Database },
    ];

    const SidebarContent = (
        <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800">
            {/* Header / Logo */}
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-600/20">
                        <Zap className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <span className="font-extrabold text-xl tracking-tight text-white block leading-none">FLOOD</span>
                        <span className="font-bold text-[10px] tracking-[0.2em] text-indigo-400 uppercase mt-1 block">Engine</span>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="ml-auto md:hidden p-1 hover:bg-slate-800 rounded-lg text-slate-400"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Navigation */}
            <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Main Menu</p>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                onViewChange(item.id as AppView);
                                if (onClose) onClose();
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                    : 'hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <div className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'} transition-colors`}>
                                <Icon size={20} />
                            </div>
                            <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                            {isActive && <ChevronRight size={14} className="text-indigo-200" />}
                        </button>
                    );
                })}

                <div className="pt-8 pb-4">
                    <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">System</p>
                    {bottomNavItems.map((item) => (
                        <button
                            key={item.id}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200 group"
                        >
                            <item.icon size={20} className="group-hover:text-slate-300" />
                            <span className="text-sm font-medium">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-800 space-y-2">
                <button
                    onClick={onOpenConnectModal}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                >
                    <Globe size={18} />
                    <span className="text-sm font-medium">Connect Shop</span>
                </button>

                <button
                    onClick={onOpenAddModal}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] mt-4"
                >
                    <Plus size={18} />
                    <span>Add Unit</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar (Fixed) */}
            <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-40">
                {SidebarContent}
            </aside>

            {/* Mobile Sidebar (Drawer) */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-72 z-50 md:hidden shadow-2xl"
                        >
                            {SidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;
