"use client"
import { Provider } from "react-redux";
import { store } from '../store'
import React from 'react';
import AuthLoader from '../components/ui/AuthLoader'


const ClientLayout: React.FC<{ children: React.ReactNode }> =({
    children,
}) => {
    return (
        <Provider store={store}>
            {/* <AuthLoader /> 로그인 정보 복원 */}
            <main className="h-full">{children}</main>
        </Provider>
    );
};

export default ClientLayout;