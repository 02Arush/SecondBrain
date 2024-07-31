import React, { createContext, useEffect, useState } from 'react';
import { getSignedInUser } from '@/api/db_ops';
import constants from '@/constants/constants';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [email, setEmail] = useState(constants.ANONYMOUS);

    useEffect(() => {
        const fetchSignedInUser = async () => {
            const data = await getSignedInUser();
            if (data && data.email) {
                setEmail(data.email);
            } else {
                setEmail(constants.ANONYMOUS);
            }
        };

        fetchSignedInUser();
    }, []); 

    return (
        <AuthContext.Provider value={{ email, setEmail }}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext, AuthProvider };
