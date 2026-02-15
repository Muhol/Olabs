'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth, useUser } from "@clerk/nextjs";
import { fetchCurrentUser } from "@/lib/api";

interface UserContextType {
    systemUser: any;
    userRole: string;
    loadingSystemUser: boolean;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const { isLoaded, user } = useUser();
    const { getToken } = useAuth();
    const [systemUser, setSystemUser] = useState<any>(null);
    const [loadingSystemUser, setLoadingSystemUser] = useState(true);

    const syncUser = async () => {
        // Guard: If we already have a system user, don't fetch again
        if (systemUser) {
            setLoadingSystemUser(false);
            return;
        }

        if (isLoaded && user) {
            try {
                const token = await getToken();
                if (token) {
                    const dbUser = await fetchCurrentUser(token);
                    setSystemUser(dbUser);
                }
            } catch (err: any) {
                if (err.status === 403) {
                    console.info("[AUTH CONTEXT] User is blocked by system policy (Registration disabled).");
                } else {
                    console.error("[AUTH CONTEXT] Failed to fetch system user:", err);
                }
            } finally {
                setLoadingSystemUser(false);
            }
        } else if (isLoaded && !user) {
            setLoadingSystemUser(false);
            setSystemUser(null);
        }
    };

    useEffect(() => {
        syncUser();
    }, [isLoaded, user, getToken]);

    // const userRole = systemUser?.role || "none";
    const userRole = systemUser?.role;

    return (
        <UserContext.Provider value={{
            systemUser,
            userRole,
            loadingSystemUser,
            refreshUser: syncUser
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUserContext() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUserContext must be used within a UserProvider');
    }
    return context;
}
