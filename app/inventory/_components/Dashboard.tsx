
/* eslint-disable @next/next/no-img-element */

import React, { useMemo } from 'react';
import { InventoryStats, MarketplaceListing } from '@/lib/inventory-types';
import { TrendingUp, Clock, Package, DollarSign, Zap, Boxes, PieChart as PieChartIcon, Plus } from 'lucide-react';
import { getDisplayUrl } from '@/lib/utils';
import { productPath } from '@/lib/routes';
import { formatUsd } from '@/lib/money';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DashboardProps {
    stats: InventoryStats;
    recentItems: MarketplaceListing[];
    onStartGenerator: () => void;
    onOpenAddModal: () => void;
}

const COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#EA580C', '#16A34A', '#0891B2', '#475569'];

const Dashboard: React.FC<DashboardProps> = ({ stats, recentItems, onStartGenerator, onOpenAddModal }) => {

    const categoryData = useMemo(() => {
        const counts: Record<string, number> = {};
        recentItems.forEach(item => {
            counts[item.category] = (counts[item.category] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [recentItems]);

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[
                    { label: 'Total Units', value: stats.totalUnits, icon: Boxes, color: 'text-blue-500' },
                    { label: 'Available', value: stats.availableCount, icon: Clock, color: 'text-emerald-500' },
                    { label: 'Listed', value: stats.listedCount, icon: TrendingUp, color: 'text-orange-500' },
                    { label: 'Total Value', value: formatUsd(stats.totalValue), icon: DollarSign, color: 'text-purple-500' },
                ].map((card, i) => (
                    <div key={i} className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                        <div className="space-y-1 md:space-y-2">
                            <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider text-slate-400">{card.label}</span>
                            <div className="text-2xl md:text-3xl font-bold text-slate-900">{card.value}</div>
                        </div>
                        <div className={`p-2 rounded-xl bg-slate-50 ${card.color}`}>
                            <card.icon size={20} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Hero Banner - ACTION AREA */}
                <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 md:p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-200 flex flex-col justify-center min-h-[280px]">
                    <div className="relative z-10 max-w-xl space-y-6">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Rapid Listing Engine</h2>
                            <p className="text-blue-100 text-lg font-medium leading-relaxed">Add inventory in seconds using AI vision analysis or bulk generate SEO descriptions for your entire stock.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={onOpenAddModal}
                                className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-blue-50 hover:scale-[1.02] transition-all shadow-xl shadow-blue-900/10"
                            >
                                <Plus size={24} strokeWidth={3} />
                                New Unit
                            </button>

                            <button
                                onClick={onStartGenerator}
                                className="bg-blue-500/30 backdrop-blur-md text-white border border-white/20 px-6 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                            >
                                <Zap size={22} />
                                Bulk Generator
                            </button>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <Zap className="absolute right-[-20px] bottom-[-40px] text-white/5 w-80 h-80 -rotate-12" />
                </div>

                {/* Category Chart */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col h-full min-h-[300px]">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="bg-slate-100 p-2 rounded-lg">
                            <PieChartIcon size={18} className="text-slate-500" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg">Inventory Mix</h3>
                    </div>
                    <div className="flex-1">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        align="center"
                                        wrapperStyle={{ fontSize: '11px', fontWeight: '600', paddingTop: '20px' }}
                                        iconType="circle"
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                                <Package size={32} className="opacity-20" />
                                <span>No data available</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Inventory Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Recent Inventory</h3>
                        <p className="text-slate-500 text-sm mt-1 font-medium">Your available units ready for listing</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                                <th className="px-6 md:px-8 py-4">Product</th>
                                <th className="px-6 md:px-8 py-4">Brand</th>
                                <th className="px-6 md:px-8 py-4">Model</th>
                                <th className="px-6 md:px-8 py-4">Condition</th>
                                <th className="px-6 md:px-8 py-4">Price</th>
                                <th className="px-6 md:px-8 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {recentItems.slice(0, 10).map((item, index) => (
                                <tr key={`${item.id}-${index}`} className="hover:bg-slate-50/80 transition-colors group cursor-default">
                                    <td className="px-6 md:px-8 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 shadow-sm shrink-0">
                                                <img src={getDisplayUrl(item.imageUrl) || ''} alt="" className="w-full h-full object-contain" />
                                            </div>
                                            {item.websiteParams?.slug ? (
                                                <a
                                                    href={productPath(item.websiteParams.slug)}
                                                    className="font-bold text-slate-900 text-sm hover:text-blue-600 hover:underline"
                                                >
                                                    {item.title}
                                                </a>
                                            ) : (
                                                <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 md:px-8 py-4 text-slate-500 text-sm font-medium">{item.brand || '-'}</td>
                                    <td className="px-6 md:px-8 py-4 text-slate-500 text-sm font-medium">{item.model || '-'}</td>
                                    <td className="px-6 md:px-8 py-4">
                                        <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide ${item.condition === 'excellent' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {item.condition}
                                        </span>
                                    </td>
                                    <td className="px-6 md:px-8 py-4 font-bold text-slate-900 text-sm">{formatUsd(item.price)}</td>
                                    <td className="px-6 md:px-8 py-4">
                                        <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wide group-hover:bg-slate-200 transition-colors">
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {recentItems.length === 0 && (
                        <div className="py-24 text-center text-slate-400 flex flex-col items-center">
                            <Package size={48} className="opacity-20 mb-4" />
                            <p className="font-medium">No inventory units found.</p>
                            <button onClick={onOpenAddModal} className="mt-2 text-blue-600 font-bold hover:underline">Add your first unit</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
