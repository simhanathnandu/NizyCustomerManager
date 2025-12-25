import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Phone, User, Users, Receipt, FileText, FileSpreadsheet, Download } from 'lucide-react';
import { collection, onSnapshot, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import CustomerForm from '../components/CustomerForm';
import Swal from 'sweetalert2';
import { useLocation, useNavigate } from 'react-router-dom';
import { exportCustomersToPDF, exportCustomersToExcel } from '../utils/exportUtils';

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (location.state?.openAddModal) {
            handleAddNew();
            window.history.replaceState({}, document.title);
        }
        // Handle coming from Billing page to Edit/View Customer
        if (location.state?.openEditModal && location.state?.customerId && customers.length > 0) {
            const customerToEdit = customers.find(c => c.id === location.state.customerId);
            if (customerToEdit) {
                handleEdit(customerToEdit);
                window.history.replaceState({}, document.title);
            }
        }
    }, [location.state, customers]);

    useEffect(() => {
        const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const customerList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCustomers(customerList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDelete = async (id, name) => {
        Swal.fire({
            title: 'Are you sure?',
            text: `You won't be able to revert this! Delete customer ${name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteDoc(doc(db, 'customers', id));
                    Swal.fire(
                        'Deleted!',
                        'Customer has been deleted.',
                        'success'
                    )
                } catch (error) {
                    Swal.fire(
                        'Error!',
                        'Failed to delete customer.',
                        'error'
                    )
                }
            }
        })
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingCustomer(null);
        setIsFormOpen(true);
    };

    const handleCreateBill = (customer) => {
        navigate('/billing', {
            state: {
                openAddModal: true,
                prefillCustomer: customer
            }
        });
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditingCustomer(null);
    };

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        customer.referenceName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        Customer Management
                    </h1>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">Manage measurements and contact details</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => exportCustomersToPDF(filteredCustomers)}
                        className="bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-600 px-4 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all shadow-sm flex items-center"
                        title="Export to PDF"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        PDF
                    </button>
                    <button
                        onClick={() => exportCustomersToExcel(filteredCustomers)}
                        className="bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-600 px-4 py-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all shadow-sm flex items-center"
                        title="Export to Excel"
                    >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                    </button>
                    <button
                        onClick={handleAddNew}
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center transform hover:-translate-y-0.5"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Customer
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-800">
                    <div className="relative max-w-md">
                        <Search className="absolute top-3 left-3 h-5 w-5 text-gray-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all shadow-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50/50 dark:bg-slate-900/50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    Name / Reference
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    Phone
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    Measurements
                                </th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                                        <div className="flex justify-center items-center space-x-2">
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                                        No customers found matched your search
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-indigo-100/50 rounded-full flex items-center justify-center border border-indigo-100 text-indigo-600">
                                                    <Users className="h-5 w-5" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{customer.name}</div>
                                                    {customer.referenceName && (
                                                        <div className="text-xs text-indigo-500 font-medium">Ref: {customer.referenceName}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-600 dark:text-slate-300">
                                                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                                {customer.phone}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {customer.measurements?.shirt && <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded text-xs font-medium">Shirt</span>}
                                                {customer.measurements?.pant && <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-100 rounded text-xs font-medium">Pant</span>}
                                                {customer.measurements?.others?.length > 0 && <span className="px-2 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded text-xs font-medium">+{customer.measurements.others.length} Others</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleCreateBill(customer)}
                                                    className="flex items-center text-emerald-600 hover:bg-emerald-50 px-2 py-1.5 rounded-lg transition-colors text-xs font-semibold mr-2 border border-emerald-200 hover:border-emerald-300"
                                                    title="Create Bill"
                                                >
                                                    <Receipt className="h-3.5 w-3.5 mr-1" />
                                                    Billing
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(customer)}
                                                    className="text-indigo-600 hover:text-indigo-900 p-1.5 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(customer.id, customer.name)}
                                                    className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden">
                    {loading ? (
                        <div className="p-10 text-center text-gray-500">
                            <div className="flex justify-center items-center space-x-2">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">
                            No customers found matched your search
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredCustomers.map((customer) => (
                                <div key={customer.id} className="p-4 hover:bg-indigo-50/30 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-100/50 rounded-full flex items-center justify-center border border-indigo-100 text-indigo-600">
                                                <Users className="h-5 w-5" />
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-semibold text-gray-900">{customer.name}</div>
                                                {customer.referenceName && (
                                                    <div className="text-xs text-indigo-500 font-medium">Ref: {customer.referenceName}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                            <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                            {customer.phone}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-4 pl-[3.25rem]">
                                        {customer.measurements?.shirt && <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded text-xs font-medium">Shirt</span>}
                                        {customer.measurements?.pant && <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-100 rounded text-xs font-medium">Pant</span>}
                                        {customer.measurements?.others?.length > 0 && <span className="px-2 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded text-xs font-medium">+{customer.measurements.others.length} Others</span>}
                                        {!customer.measurements?.shirt && !customer.measurements?.pant && (!customer.measurements?.others || customer.measurements?.others?.length === 0) && (
                                            <span className="text-xs text-gray-400 italic">No measurements</span>
                                        )}
                                    </div>

                                    <div className="flex justify-end space-x-2 pt-2 border-t border-gray-50">
                                        <button
                                            onClick={() => handleCreateBill(customer)}
                                            className="flex items-center text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold border border-emerald-200"
                                        >
                                            <Receipt className="h-3.5 w-3.5 mr-1.5" />
                                            Create Bill
                                        </button>
                                        <button
                                            onClick={() => handleEdit(customer)}
                                            className="flex items-center text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold border border-indigo-200"
                                        >
                                            <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(customer.id, customer.name)}
                                            className="flex items-center text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold border border-red-200"
                                        >
                                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isFormOpen && (
                <CustomerForm
                    onClose={handleFormClose}
                    onSave={() => {
                        Swal.fire({
                            icon: 'success',
                            title: 'Saved!',
                            text: 'Customer details saved successfully',
                            timer: 1500,
                            showConfirmButton: false
                        })
                    }}
                    initialData={editingCustomer}
                />
            )}
        </div>
    );
}
