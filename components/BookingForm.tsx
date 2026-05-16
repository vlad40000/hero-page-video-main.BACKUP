import React, { useState } from 'react';
import { submitBooking } from '../actions/booking';
import { LoaderIcon, CheckIcon } from './Icons';

interface BookingFormProps {
    context: any; // The appliance data to pass along
    onClose: () => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({ context, onClose }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const formData = new FormData(event.currentTarget);
        const result = await submitBooking(formData, context);

        setIsSubmitting(false);
        if (result.success) {
            setIsSuccess(true);
        } else {
            setError(result.error || "Failed to submit booking. Please try again.");
        }
    }

    if (isSuccess) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transform scale-100 transition-all">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckIcon size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Booking Confirmed!</h2>
                    <p className="text-slate-500 mb-8">We have received your request. A dispatcher will contact you shortly.</p>
                    <button onClick={onClose} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all">
                        Done
                    </button>
                    {error && (
                        <p className="mt-4 text-sm text-red-600 font-medium">{error}</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            {/* Form Card */}
            <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Book Service</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fast-Track Scheduling</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-400 font-bold hover:bg-slate-200">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                        <input name="name" required type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="Jane Doe" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                        <input name="phone" required type="tel" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="(555) 123-4567" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Service Address</label>
                        <input name="address" required type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="123 Main St" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes (Gate code, etc)</label>
                        <textarea name="notes" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all h-24 resize-none" placeholder="Any details..." />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 mb-4 animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                        {isSubmitting ? <LoaderIcon className="animate-spin" /> : "Confirm Booking"}
                    </button>
                </form>
            </div>
        </div>
    );
};
