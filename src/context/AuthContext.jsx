import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedAuth = localStorage.getItem('isAuthenticated');
        if (storedAuth === 'true') {
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    const login = (username, password) => {
        if (username === 'Admin' && password === 'Nizy@9849') {
            setIsAuthenticated(true);
            localStorage.setItem('isAuthenticated', 'true');
            return { success: true };
        } else {
            return { success: false, message: 'Invalid username or password' };
        }
    };

    const logout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
