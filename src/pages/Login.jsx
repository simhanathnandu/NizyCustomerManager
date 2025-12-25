import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, ArrowRight } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        const result = login(username, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200 transform rotate-3">
                            <Lock className="h-6 w-6 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome Back</h2>
                        <p className="text-gray-500 mt-2">Sign in to access your dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-sm font-medium border border-red-100 flex items-center animate-shake">
                                <span className="mr-2">⚠️</span> {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Username</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                                    placeholder="Enter username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-indigo-200 flex items-center justify-center group"
                        >
                            Sign In
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                </div>
                <div className="bg-gray-50 px-8 py-4 text-center text-sm text-gray-500 border-t border-gray-100">
                    <p>Protected System • Nizy Fashion</p>
                </div>
            </div>
        </div>
    );
}
