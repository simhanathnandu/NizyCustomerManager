import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { format } from 'date-fns';
import { Users, ShoppingBag, CreditCard, Calendar, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalCustomers: 0,
        activeOrders: 0,
        pendingPayments: 0,
        ordersDueToday: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

        const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const today = new Date().toISOString().split('T')[0];

            const active = orders.filter(o => o.status !== 'Completed' && o.status !== 'Delivered').length;
            const pending = orders.reduce((sum, o) => sum + (Number(o.balanceAmount) || 0), 0);
            const dueToday = orders.filter(o => o.dueDate === today && o.status !== 'Delivered').length;

            setStats(prev => ({
                ...prev,
                activeOrders: active,
                pendingPayments: pending,
                ordersDueToday: dueToday
            }));

            setRecentOrders(orders.slice(0, 5));
        });

        const qCustomers = collection(db, 'customers');
        const unsubscribeCustomers = onSnapshot(qCustomers, (snapshot) => {
            setStats(prev => ({ ...prev, totalCustomers: snapshot.size }));
            setLoading(false);
        });

        return () => {
            unsubscribeOrders();
            unsubscribeCustomers();
        };
    }, []);

    const StatCard = ({ title, value, icon: Icon, color, bgGradient }) => (
        <div className={`relative overflow-hidden rounded-2xl p-6 shadow-lg bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${bgGradient} opacity-10 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:scale-110`}></div>
            <div className="flex items-center">
                <div className={`p-3 rounded-xl ${bgGradient} text-white shadow-lg`}>
                    <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4 z-10">
                    <h3 className="text-gray-500 dark:text-slate-400 text-sm font-semibold tracking-wide uppercase">{title}</h3>
                    <p className="text-3xl font-extrabold text-gray-900 dark:text-slate-100 mt-1">{loading ? '-' : value}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        Dashboard Overview
                    </h1>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">Welcome back to your tailoring business</p>
                </div>
                <div className="mt-4 sm:mt-0 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 flex items-center">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2 pulse"></div>
                    <span className="text-sm font-medium text-gray-600 dark:text-slate-300">System Active</span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Customers"
                    value={stats.totalCustomers}
                    icon={Users}
                    bgGradient="from-indigo-500 to-blue-500"
                />
                <StatCard
                    title="Active Orders"
                    value={stats.activeOrders}
                    icon={ShoppingBag}
                    bgGradient="from-blue-500 to-cyan-500"
                />
                <StatCard
                    title="Pending Payments"
                    value={`₹${stats.pendingPayments}`}
                    icon={CreditCard}
                    bgGradient="from-amber-500 to-orange-500"
                />
                <StatCard
                    title="Orders Due Today"
                    value={stats.ordersDueToday}
                    icon={Calendar}
                    bgGradient="from-rose-500 to-pink-500"
                />
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-800 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Recent Orders</h3>
                    </div>
                    <Link to="/billing" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                        View All Orders &rarr;
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50/50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-slate-700">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading data...</td></tr>
                            ) : recentOrders.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No recent orders found</td></tr>
                            ) : (
                                recentOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 group-hover:border-indigo-200">
                                                #{order.id.slice(-6).toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900 dark:text-slate-100">{order.customerName}</div>
                                            <div className="text-xs text-gray-500 dark:text-slate-400">{order.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${order.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                                                order.status === 'Delivered' ? 'bg-cyan-100 text-cyan-700 border-cyan-200' :
                                                    'bg-amber-100 text-amber-700 border-amber-200'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-slate-100">
                                            ₹{order.totalAmount}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {order.createdAt ? format(new Date(order.createdAt), 'MMM d, h:mm a') : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
