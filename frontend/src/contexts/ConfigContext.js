import React, { createContext, useContext, useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Currency configuration
const defaultConfig = {
  currency: 'INR',
  currencySymbol: '₹'
};

const ConfigContext = createContext(defaultConfig);

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(defaultConfig);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${API_URL}/api/config`);
        if (res.ok) {
          const data = await res.json();
          setConfig({
            currency: data.currency || 'INR',
            currencySymbol: data.currency_symbol || '₹'
          });
        }
      } catch (error) {
        console.error('Failed to fetch config:', error);
      }
    };
    fetchConfig();
  }, []);

  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);

// Helper function to format currency
export const formatCurrency = (amount, symbol = '₹') => {
  return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
