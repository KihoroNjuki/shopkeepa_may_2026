// src/context/PrivilegeContext.jsx

import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api';

const PrivilegeContext = createContext(null);

export function PrivilegeProvider({ children }) {
  const [privileges, setPrivileges] = useState(null);
  const [businessId, setBusinessId] = useState(null);

  const loadPrivileges = useCallback(async (bizId) => {
    if (bizId === businessId && privileges) return;
    try {
      const { data } = await api.get(`/business/${bizId}/my-privileges/`);
      setPrivileges(data);
      setBusinessId(bizId);
    } catch {
      setPrivileges(null);
    }
  }, [businessId, privileges]);

  const can = (action) => {
    if (!privileges) return false;
    if (privileges.is_owner) return true;
    return privileges[action] === true;
  };

  const isOwner = () => privileges?.is_owner === true;

  return (
    <PrivilegeContext.Provider value={{ privileges, loadPrivileges, can, isOwner }}>
      {children}
    </PrivilegeContext.Provider>
  );
}

export const usePrivileges = () => useContext(PrivilegeContext);