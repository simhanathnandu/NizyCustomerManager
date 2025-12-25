import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, CheckCircle, Clock, AlertCircle, Trash2, Receipt, User, FileText, FileSpreadsheet, Download } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import OrderForm from '../components/OrderForm';
import { format } from 'date-fns';
import Swal from 'sweetalert2';
import { useLocation, useNavigate } from 'react-router-dom';
import { exportOrdersToPDF, exportOrdersToExcel, generateInvoicePDF } from '../utils/exportUtils';

export default function Billing() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState(null);
    const [prefillCustomer, setPrefillCustomer] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (location.state?.openAddModal) {
            setEditingOrder(null);
            if (location.state?.prefillCustomer) {
                setPrefillCustomer(location.state.prefillCustomer);
            } else {
                setPrefillCustomer(null);
            }
            setIsFormOpen(true);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    useEffect(() => {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setOrders(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleEdit = (order) => {
        setPrefillCustomer(null);
        setEditingOrder(order);
        setIsFormOpen(true);
    };

    const handleCreateNew = () => {
        setEditingOrder(null);
        setPrefillCustomer(null);
        setIsFormOpen(true);
    };

    const handleDelete = async (orderId) => {
        Swal.fire({
            title: 'Delete Order?',
            text: "This will permanently delete this order record.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteDoc(doc(db, 'orders', orderId));
                    Swal.fire('Deleted!', 'Order has been removed.', 'success');
                } catch (error) {
                    console.error('Error deleting order:', error);
                    Swal.fire('Error!', 'Failed to delete order.', 'error');
                }
            }
        });
    };

    const handleViewCustomer = (customerId) => {
        navigate('/customers', {
            state: {
                openEditModal: true,
                customerId: customerId
            }
        });
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.phone.includes(searchTerm);
        const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status) => {
        const styles = {
            'Completed': 'bg-emerald-100 text-emerald-800 border-emerald-200',
            'Delivered': 'bg-blue-100 text-blue-800 border-blue-200',
            'Partially Completed': 'bg-amber-100 text-amber-800 border-amber-200',
            'Pending': 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles['Pending']}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                        Billing & Orders
                    </h1>
                    <p className="text-gray-500 mt-1">Create invoices and track status</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => exportOrdersToPDF(filteredOrders)}
                        className="bg-white text-indigo-600 border border-indigo-200 px-4 py-2.5 rounded-xl hover:bg-indigo-50 transition-all shadow-sm flex items-center"
                        title="Export Summary PDF"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        PDF
                    </button>
                    <button
                        onClick={() => exportOrdersToExcel(filteredOrders)}
                        className="bg-white text-emerald-600 border border-emerald-200 px-4 py-2.5 rounded-xl hover:bg-emerald-50 transition-all shadow-sm flex items-center"
                        title="Export Summary Excel"
                    >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                    </button>
                    <button
                        onClick={handleCreateNew}
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center transform hover:-translate-y-0.5"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Create Bill
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative flex-1 w-full max-w-md">
                        <Search className="absolute top-3 left-3 h-5 w-5 text-gray-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search by customer or phone..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="w-full md:w-auto rounded-xl border-gray-200 dark:border-slate-600 border px-4 py-2.5 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Partially Completed">Partially Completed</option>
                        <option value="Completed">Completed</option>
                        <option value="Delivered">Delivered</option>
                    </select>
                </div>

                <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50/50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Due Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Balance</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center text-gray-500 dark:text-slate-400">
                                        <div className="flex justify-center items-center space-x-2">
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500 dark:text-slate-400">No orders found</td></tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-gray-600 dark:text-slate-300 text-xs">#{order.id.slice(-6).toUpperCase()}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center justify-between group/customer">
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{order.customerName}</div>
                                                    <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center mt-0.5">
                                                        {order.phone}
                                                    </div>
                                                </div>
                                                {order.customerId && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleViewCustomer(order.customerId); }}
                                                        className="text-gray-400 hover:text-indigo-600 p-1 rounded-full hover:bg-indigo-50 transition-colors opacity-0 group-hover/customer:opacity-100"
                                                        title="View Customer Profile"
                                                    >
                                                        <User className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {order.dueDate ? format(new Date(order.dueDate), 'MMM d, yyyy') : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(order.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="font-semibold text-gray-900">₹{order.totalAmount}</div>
                                            {order.balanceAmount > 0 ? (
                                                <div className="text-red-500 text-xs font-medium bg-red-50 px-2 py-0.5 rounded inline-block mt-1">Due: ₹{order.balanceAmount}</div>
                                            ) : (
                                                <div className="text-green-600 text-xs font-medium bg-green-50 px-2 py-0.5 rounded inline-block mt-1">Paid</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => generateInvoicePDF(order)}
                                                    className="text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                                                    title="Download Invoice"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(order)}
                                                    className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors"
                                                    title="Edit Order"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(order.id)}
                                                    className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                                    title="Delete Order"
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

                {/* Mobile/Tablet Card View */}
                <div className="lg:hidden">
                    {loading ? (
                        <div className="p-10 text-center text-gray-500">
                            <div className="flex justify-center items-center space-x-2">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">
                            No orders found
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredOrders.map((order) => (
                                <div key={order.id} className="p-4 hover:bg-indigo-50/30 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2 py-1 bg-gray-100 rounded text-gray-600 text-xs font-mono">#{order.id.slice(-6).toUpperCase()}</span>
                                                {getStatusBadge(order.status)}
                                            </div>
                                            <div className="text-sm font-semibold text-gray-900">{order.customerName}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{order.phone}</div>
                                        </div>
                                        {order.customerId && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleViewCustomer(order.customerId); }}
                                                className="text-gray-400 hover:text-indigo-600 p-1.5 rounded-full hover:bg-indigo-50 transition-colors"
                                                title="View Customer Profile"
                                            >
                                                <User className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                                        <div className="bg-gray-50 px-2 py-1.5 rounded border border-gray-100">
                                            <div className="text-gray-500 text-[10px] uppercase tracking-wide mb-0.5">Due Date</div>
                                            <div className="text-gray-700 font-medium">{order.dueDate ? format(new Date(order.dueDate), 'MMM d, yyyy') : '-'}</div>
                                        </div>
                                        <div className="bg-gray-50 px-2 py-1.5 rounded border border-gray-100">
                                            <div className="text-gray-500 text-[10px] uppercase tracking-wide mb-0.5">Total</div>
                                            <div className="text-gray-900 font-semibold">₹{order.totalAmount}</div>
                                        </div>
                                    </div>

                                    {order.balanceAmount > 0 ? (
                                        <div className="text-red-500 text-xs font-medium bg-red-50 px-2 py-1 rounded inline-block mb-3 border border-red-100">Due: ₹{order.balanceAmount}</div>
                                    ) : (
                                        <div className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded inline-block mb-3 border border-green-100">Paid in Full</div>
                                    )}

                                    <div className="flex justify-end space-x-2 pt-2 border-t border-gray-50">
                                        <button
                                            onClick={() => generateInvoicePDF(order)}
                                            className="flex items-center text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold border border-gray-200"
                                        >
                                            <Download className="h-3.5 w-3.5 mr-1.5" />
                                            Invoice
                                        </button>
                                        <button
                                            onClick={() => handleEdit(order)}
                                            className="flex items-center text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold border border-indigo-200"
                                        >
                                            <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(order.id)}
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
                <OrderForm
                    onClose={() => setIsFormOpen(false)}
                    onSave={() => {
                        Swal.fire({
                            icon: 'success',
                            title: 'Success',
                            text: 'Order saved successfully!',
                            timer: 1500,
                            showConfirmButton: false
                        })
                    }}
                    initialData={editingOrder}
                    prefillCustomer={prefillCustomer}
                />
            )}
        </div>
    );
}
