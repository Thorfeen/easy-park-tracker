
import { useState, useCallback, useRef } from 'react';
import { ThermalPrinter } from '@/utils/thermalPrinter';

export const useThermalPrinter = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printerIP, setPrinterIP] = useState<string>('');
  const printerRef = useRef<ThermalPrinter | null>(null);

  const connect = useCallback(async (ip?: string) => {
    setIsConnecting(true);
    setError(null);
    
    try {
      if (!printerRef.current) {
        printerRef.current = new ThermalPrinter();
      }
      
      const success = await printerRef.current.connect(ip);
      setIsConnected(success);
      
      if (success && ip) {
        setPrinterIP(ip);
        // Store IP in localStorage for future use
        localStorage.setItem('printerIP', ip);
      }
      
      if (!success) {
        setError('Failed to connect to printer. Make sure the printer is online and WebSocket proxy is running.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const connectWithIP = useCallback(async (ip: string) => {
    await connect(ip);
  }, [connect]);

  const disconnect = useCallback(async () => {
    setError(null);
    
    try {
      if (printerRef.current) {
        await printerRef.current.disconnect();
        setIsConnected(false);
        setPrinterIP('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    }
  }, []);

  const printReceipt = useCallback(async (receiptData: string): Promise<boolean> => {
    setError(null);
    
    try {
      if (!printerRef.current || !isConnected) {
        setError('Printer not connected');
        return false;
      }
      
      const success = await printerRef.current.printReceipt(receiptData);
      
      if (!success) {
        setError('Failed to print receipt');
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Print error occurred');
      return false;
    }
  }, [isConnected]);

  // Load saved printer IP on mount
  const loadSavedIP = useCallback(() => {
    const savedIP = localStorage.getItem('printerIP');
    if (savedIP) {
      setPrinterIP(savedIP);
      return savedIP;
    }
    return '';
  }, []);

  return {
    isConnected,
    isConnecting,
    error,
    printerIP,
    connect,
    connectWithIP,
    disconnect,
    printReceipt,
    loadSavedIP,
  };
};
