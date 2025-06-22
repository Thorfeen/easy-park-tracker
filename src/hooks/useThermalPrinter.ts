
import { useState, useCallback, useRef } from 'react';
import { ThermalPrinter } from '@/utils/thermalPrinter';

export const useThermalPrinter = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState(() => {
    return localStorage.getItem('printerServerUrl') || 'http://localhost:3001';
  });
  const printerRef = useRef<ThermalPrinter | null>(null);

  const updateServerUrl = useCallback((url: string) => {
    setServerUrl(url);
    localStorage.setItem('printerServerUrl', url);
    if (printerRef.current) {
      printerRef.current.setServerUrl(url);
    }
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      if (!printerRef.current) {
        printerRef.current = new ThermalPrinter(serverUrl);
      } else {
        printerRef.current.setServerUrl(serverUrl);
      }
      
      const success = await printerRef.current.connect();
      setIsConnected(success);
      
      if (!success) {
        setError('Failed to connect to printer server. Make sure the Node.js server is running.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, [serverUrl]);

  const disconnect = useCallback(async () => {
    setError(null);
    
    try {
      if (printerRef.current) {
        await printerRef.current.disconnect();
        setIsConnected(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    }
  }, []);

  const printReceipt = useCallback(async (receiptData: string): Promise<boolean> => {
    setError(null);
    
    try {
      if (!printerRef.current || !isConnected) {
        setError('Printer server not connected');
        return false;
      }
      
      const success = await printerRef.current.printReceipt(receiptData);
      
      if (!success) {
        setError('Failed to print receipt via server');
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Print error occurred');
      return false;
    }
  }, [isConnected]);

  return {
    isConnected,
    isConnecting,
    error,
    serverUrl,
    updateServerUrl,
    connect,
    disconnect,
    printReceipt,
  };
};
