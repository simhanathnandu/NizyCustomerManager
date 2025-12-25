import { useState, useEffect } from 'react';
import { X, Plus, Trash2, User, Ruler } from 'lucide-react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Swal from 'sweetalert2';

export default function CustomerForm({ onClose, onSave, initialData }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        referenceName: '',
        phone: '',
        measurements: {
            shirt: '',
            pant: '',
            others: []
        }
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const customerData = {
                ...formData,
                updatedAt: new Date().toISOString()
            };

            if (!initialData) {
                customerData.createdAt = new Date().toISOString();
                const docRef = await addDoc(collection(db, 'customers'), customerData);
                onSave({ id: docRef.id, ...customerData });
            } else {
                const docRef = doc(db, 'customers', initialData.id);
                await updateDoc(docRef, customerData);
                onSave({ id: initialData.id, ...customerData });
            }
            onClose();
        } catch (error) {
            console.error("Error saving customer: ", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to save customer details'
            });
        } finally {
            setLoading(false);
        }
    };

    const addOtherMeasurement = () => {
        setFormData(prev => ({
            ...prev,
            measurements: {
                ...prev.measurements,
                others: [...(prev.measurements.others || []), { name: '', value: '' }]
            }
        }));
    };

    const removeOtherMeasurement = (index) => {
        setFormData(prev => ({
            ...prev,
            measurements: {
                ...prev.measurements,
                others: prev.measurements.others.filter((_, i) => i !== index)
            }
        }));
    };

    const updateOtherMeasurement = (index, field, value) => {
        const newOthers = [...(formData.measurements.others || [])];
        newOthers[index] = { ...newOthers[index], [field]: value };
        setFormData(prev => ({
            ...prev,
            measurements: {
                ...prev.measurements,
                others: newOthers
            }
        }));
    };

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 animate-fadeIn">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                    <div className="flex items-center space-x-2">
                        <User className="h-5 w-5 text-indigo-600" />
                        <h3 className="text-xl font-bold text-gray-900">
                            {initialData ? 'Edit Customer' : 'Add New Customer'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                required
                                className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 bg-gray-50 focus:bg-white transition-colors"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Nick Name / Ref</label>
                            <input
                                type="text"
                                className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 bg-gray-50 focus:bg-white transition-colors"
                                value={formData.referenceName}
                                onChange={(e) => setFormData({ ...formData, referenceName: e.target.value })}
                                placeholder="e.g. Johnny"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                            <input
                                type="tel"
                                required
                                className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 bg-gray-50 focus:bg-white transition-colors"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+91 98765 43210"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <div className="flex items-center space-x-2 mb-4">
                            <Ruler className="h-5 w-5 text-indigo-600" />
                            <h4 className="text-lg font-bold text-gray-900">Measurements</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Shirt Details</label>
                                <textarea
                                    rows={4}
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 bg-gray-50 focus:bg-white transition-colors"
                                    value={formData.measurements.shirt}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        measurements: { ...formData.measurements, shirt: e.target.value }
                                    })}
                                    placeholder="Length: 40, Chest: 38..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Pant Details</label>
                                <textarea
                                    rows={4}
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 bg-gray-50 focus:bg-white transition-colors"
                                    value={formData.measurements.pant}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        measurements: { ...formData.measurements, pant: e.target.value }
                                    })}
                                    placeholder="Waist: 32, Length: 40..."
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Additional Measurements</label>
                            <div className="space-y-3">
                                {(formData.measurements.others || []).map((item, index) => (
                                    <div key={index} className="flex gap-2 items-start">
                                        <input
                                            type="text"
                                            placeholder="Label (e.g. Collar)"
                                            className="flex-1 rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 bg-gray-50"
                                            value={item.name}
                                            onChange={(e) => updateOtherMeasurement(index, 'name', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Value"
                                            className="flex-1 rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 bg-gray-50"
                                            value={item.value}
                                            onChange={(e) => updateOtherMeasurement(index, 'value', e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeOtherMeasurement(index)}
                                            className="text-red-500 hover:text-red-700 p-2.5 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addOtherMeasurement}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-2"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Field
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 border border-transparent rounded-xl shadow-lg shadow-indigo-200 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all hover:-translate-y-0.5"
                        >
                            {loading ? 'Saving...' : 'Save Customer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
