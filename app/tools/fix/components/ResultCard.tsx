
import React from 'react';

interface ResultCardProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}

export const ResultCard: React.FC<ResultCardProps> = ({ title, icon, children }) => {
    return (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                {icon && <span className="text-blue-600">{icon}</span>}
                <h3 className="font-bold text-slate-800 tracking-tight">{title}</h3>
            </div>
            <div className="p-6 md:p-8">
                {children}
            </div>
        </div>
    );
};
