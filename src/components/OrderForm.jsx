import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Search, Receipt } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import Swal from 'sweetalert2';

export default function OrderForm({ onClose, onSave, initialData, prefillCustomer }) {
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    const [formData, setFormData] = useState({
        customerId: '',
        customerName: '',
        phone: '',
        items: [],
        dueDate: '',
        paidAmount: 0,
        status: 'Pending',
        shirtsCompleted: 0,
        pantsCompleted: 0
    });

    const [predefinedItems, setPredefinedItems] = useState({
        shirt: { enabled: false, quantity: 1, cost: 0 },
        pant: { enabled: false, quantity: 1, cost: 0 }
    });

    useEffect(() => {
        const fetchCustomers = async () => {
            const q = query(collection(db, 'customers'), orderBy('name'));
            const snapshot = await getDocs(q);
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCustomers(list);
        };
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            const date = new Date();
            date.setDate(date.getDate() + 7);

            let initialFormData = {
                customerId: '',
                customerName: '',
                phone: '',
                items: [],
                dueDate: date.toISOString().split('T')[0],
                paidAmount: 0,
                status: 'Pending',
                shirtsCompleted: 0,
                pantsCompleted: 0
            };

            if (prefillCustomer) {
                initialFormData.customerId = prefillCustomer.id;
                initialFormData.customerName = prefillCustomer.name;
                initialFormData.phone = prefillCustomer.phone;
                setSearchTerm(prefillCustomer.name);
            }

            setFormData(initialFormData);
        }
    }, [initialData, prefillCustomer]);

    const calculateTotal = () => {
        let total = 0;
        if (predefinedItems.shirt.enabled) total += predefinedItems.shirt.quantity * predefinedItems.shirt.cost;
        if (predefinedItems.pant.enabled) total += predefinedItems.pant.quantity * predefinedItems.pant.cost;
        formData.items.forEach(item => {
            total += (Number(item.quantity) || 0) * (Number(item.cost) || 0);
        });
        return total;
    };

    const totalAmount = calculateTotal();
    const balanceAmount = totalAmount - formData.paidAmount;

    const handleCustomerSelect = (customer) => {
        setFormData(prev => ({
            ...prev,
            customerId: customer.id,
            customerName: customer.name,
            phone: customer.phone
        }));
        setSearchTerm(customer.name);
        setShowCustomerDropdown(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.customerId || !formData.customerName) {
            Swal.fire('Error', 'Please select a customer', 'error');
            return;
        }

        // Construct final items
        const finalItems = [...formData.items];
        if (predefinedItems.shirt.enabled) {
            finalItems.unshift({ type: 'shirt', name: 'Shirt', quantity: predefinedItems.shirt.quantity, cost: predefinedItems.shirt.cost });
        }
        if (predefinedItems.pant.enabled) {
            finalItems.unshift({ type: 'pant', name: 'Pant', quantity: predefinedItems.pant.quantity, cost: predefinedItems.pant.cost });
        }

        if (finalItems.length === 0) {
            Swal.fire('Error', 'Please add at least one item', 'error');
            return;
        }

        setLoading(true);
        try {
            const orderData = {
                ...formData,
                items: finalItems,
                totalAmount,
                balanceAmount,
                paymentStatus: balanceAmount <= 0 ? 'Paid' : (formData.paidAmount > 0 ? 'Partial' : 'Pending'),
                updatedAt: new Date().toISOString()
            };

            if (!initialData) {
                orderData.createdAt = new Date().toISOString();
                const docRef = await addDoc(collection(db, 'orders'), orderData);
                onSave({ id: docRef.id, ...orderData });
            } else {
                const docRef = doc(db, 'orders', initialData.id);
                await updateDoc(docRef, orderData);
                onSave({ id: initialData.id, ...orderData });
            }
            onClose();
        } catch (error) {
            console.error("Error saving order: ", error);
            Swal.fire('Error', 'Failed to save order', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Dynamic Item Handlers
    const addDynamicItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { name: '', quantity: 1, cost: 0 }]
        }));
    };

    const updateDynamicItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const removeDynamicItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 animate-fadeIn">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                    <div className="flex items-center space-x-2">
                        <Receipt className="h-5 w-5 text-indigo-600" />
                        <h3 className="text-xl font-bold text-gray-900">
                            {initialData ? 'Edit Order' : 'Create New Bill'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-8">
                    <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Select Customer</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search Customer by Name or Phone..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setShowCustomerDropdown(true);
                                }}
                                onFocus={() => setShowCustomerDropdown(true)}
                            />
                            <Search className="absolute top-3 left-3 h-5 w-5 text-gray-400" />

                            {showCustomerDropdown && searchTerm && (
                                <div className="absolute z-10 w-full mt-2 bg-white shadow-xl max-h-60 rounded-xl py-2 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                    {filteredCustomers.length > 0 ? (
                                        filteredCustomers.map(customer => (
                                            <div
                                                key={customer.id}
                                                className="cursor-pointer select-none relative py-2.5 px-4 hover:bg-indigo-50 border-b border-gray-50 last:border-0"
                                                onClick={() => handleCustomerSelect(customer)}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold text-gray-900">{customer.name}</span>
                                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{customer.phone}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                            No customers found.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {formData.customerName && (
                            <div className="mt-3 flex items-center text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-100 w-fit">
                                <span className="font-bold mr-2">Selected:</span> {formData.customerName} ({formData.phone})
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Order Items */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Order Items</h4>

                            {/* Predefined Items */}
                            <div className="space-y-4 bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                                {/* Headers for mobile/tablet */}
                                <div className="hidden sm:grid grid-cols-[1fr,auto,auto] gap-2 pb-2 border-b border-gray-200 md:hidden">
                                    <span className="text-xs font-semibold text-gray-500 uppercase">Item</span>
                                    <span className="text-xs font-semibold text-gray-500 uppercase text-center w-16">Qty</span>
                                    <span className="text-xs font-semibold text-gray-500 uppercase text-center w-24">Cost (₹)</span>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between group space-y-2 sm:space-y-0">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={predefinedItems.shirt.enabled}
                                            onChange={(e) => setPredefinedItems({ ...predefinedItems, shirt: { ...predefinedItems.shirt, enabled: e.target.checked } })}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-3 text-sm font-medium text-gray-700">Shirts</span>
                                    </div>
                                    {predefinedItems.shirt.enabled && (
                                        <div className="flex items-center space-x-2 ml-7 sm:ml-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                <label className="text-xs text-gray-500 sm:hidden">Quantity:</label>
                                                <input
                                                    type="number" min="1"
                                                    className="w-full sm:w-16 rounded-lg border-gray-200 shadow-sm sm:text-sm border p-1.5 focus:ring-indigo-500 text-center"
                                                    placeholder="Qty"
                                                    value={predefinedItems.shirt.quantity}
                                                    onChange={(e) => setPredefinedItems({ ...predefinedItems, shirt: { ...predefinedItems.shirt, quantity: Number(e.target.value) } })}
                                                />
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                <label className="text-xs text-gray-500 sm:hidden">Cost:</label>
                                                <div className="relative">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                                                    <input
                                                        type="number" min="0"
                                                        className="w-full sm:w-24 pl-6 pr-2 rounded-lg border-gray-200 shadow-sm sm:text-sm border p-1.5 focus:ring-indigo-500 text-center"
                                                        placeholder="0"
                                                        value={predefinedItems.shirt.cost}
                                                        onChange={(e) => setPredefinedItems({ ...predefinedItems, shirt: { ...predefinedItems.shirt, cost: Number(e.target.value) } })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between group space-y-2 sm:space-y-0">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={predefinedItems.pant.enabled}
                                            onChange={(e) => setPredefinedItems({ ...predefinedItems, pant: { ...predefinedItems.pant, enabled: e.target.checked } })}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-3 text-sm font-medium text-gray-700">Pants</span>
                                    </div>
                                    {predefinedItems.pant.enabled && (
                                        <div className="flex items-center space-x-2 ml-7 sm:ml-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                <label className="text-xs text-gray-500 sm:hidden">Quantity:</label>
                                                <input
                                                    type="number" min="1"
                                                    className="w-full sm:w-16 rounded-lg border-gray-200 shadow-sm sm:text-sm border p-1.5 focus:ring-indigo-500 text-center"
                                                    placeholder="Qty"
                                                    value={predefinedItems.pant.quantity}
                                                    onChange={(e) => setPredefinedItems({ ...predefinedItems, pant: { ...predefinedItems.pant, quantity: Number(e.target.value) } })}
                                                />
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                <label className="text-xs text-gray-500 sm:hidden">Cost:</label>
                                                <div className="relative">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                                                    <input
                                                        type="number" min="0"
                                                        className="w-full sm:w-24 pl-6 pr-2 rounded-lg border-gray-200 shadow-sm sm:text-sm border p-1.5 focus:ring-indigo-500 text-center"
                                                        placeholder="0"
                                                        value={predefinedItems.pant.cost}
                                                        onChange={(e) => setPredefinedItems({ ...predefinedItems, pant: { ...predefinedItems.pant, cost: Number(e.target.value) } })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Dynamic Items */}
                            <div className="space-y-3">
                                {/* Headers for mobile/tablet */}
                                {formData.items.length > 0 && (
                                    <div className="hidden sm:grid grid-cols-[1fr,auto,auto,auto] gap-2 pb-2 border-b border-gray-200 md:hidden">
                                        <span className="text-xs font-semibold text-gray-500 uppercase">Item Name</span>
                                        <span className="text-xs font-semibold text-gray-500 uppercase text-center w-16">Qty</span>
                                        <span className="text-xs font-semibold text-gray-500 uppercase text-center w-24">Cost (₹)</span>
                                        <span className="w-8"></span>
                                    </div>
                                )}
                                {formData.items.map((item, index) => (
                                    <div key={index} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center animate-fadeIn bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none">
                                        <div className="w-full sm:flex-1">
                                            <label className="text-xs text-gray-500 sm:hidden mb-1 block">Item Name:</label>
                                            <input
                                                type="text"
                                                placeholder="Item Name"
                                                className="w-full rounded-lg border-gray-200 shadow-sm sm:text-sm border p-1.5 focus:ring-indigo-500"
                                                value={item.name}
                                                onChange={(e) => updateDynamicItem(index, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <div className="flex-1 sm:flex-none">
                                                <label className="text-xs text-gray-500 sm:hidden mb-1 block">Quantity:</label>
                                                <input
                                                    type="number" min="1"
                                                    className="w-full sm:w-16 rounded-lg border-gray-200 shadow-sm sm:text-sm border p-1.5 focus:ring-indigo-500 text-center"
                                                    placeholder="Qty"
                                                    value={item.quantity}
                                                    onChange={(e) => updateDynamicItem(index, 'quantity', Number(e.target.value))}
                                                />
                                            </div>
                                            <div className="flex-1 sm:flex-none">
                                                <label className="text-xs text-gray-500 sm:hidden mb-1 block">Cost:</label>
                                                <div className="relative">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                                                    <input
                                                        type="number" min="0"
                                                        className="w-full sm:w-24 pl-6 pr-2 rounded-lg border-gray-200 shadow-sm sm:text-sm border p-1.5 focus:ring-indigo-500 text-center"
                                                        placeholder="0"
                                                        value={item.cost}
                                                        onChange={(e) => updateDynamicItem(index, 'cost', Number(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeDynamicItem(index)}
                                                className="text-red-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg self-end sm:self-auto"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addDynamicItem}
                                    className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center"
                                >
                                    <Plus className="h-4 w-4 mr-1" /> Add Custom Item
                                </button>
                            </div>
                        </div>

                        {/* Payment & Status */}
                        <div className="space-y-6 bg-gray-50/80 p-6 rounded-2xl h-fit border border-gray-100">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Due Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Order Status</label>
                                <select
                                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 bg-white"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Partially Completed">Partially Completed</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Delivered">Delivered</option>
                                </select>
                            </div>

                            <div className="border-t border-gray-200 pt-4 space-y-4">
                                <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                    <span className="font-medium text-gray-600">Total Amount</span>
                                    <span className="text-xl font-bold text-gray-900">₹{totalAmount}</span>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Amount Paid</label>
                                    <input
                                        type="number" min="0" max={totalAmount}
                                        className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5"
                                        value={formData.paidAmount}
                                        onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                                    />
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <span className="font-bold text-gray-700">Balance Due</span>
                                    <span className={`text-xl font-bold ${balanceAmount > 0 ? "text-red-500" : "text-green-500"}`}>
                                        ₹{balanceAmount}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 border border-transparent rounded-xl shadow-lg shadow-indigo-200 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all hover:-translate-y-0.5"
                        >
                            {loading ? 'Processing...' : 'Save Order'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
