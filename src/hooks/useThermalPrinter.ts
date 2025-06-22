
import { useState, useCallback, useRef } from 'react';
import { ThermalPrinter } from '@/utils/thermalPrinter';

export const useThermalPrinter = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printerRef = useRef<ThermalPrinter | null>(null);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      if (!printerRef.current) {
        printerRef.current = new ThermalPrinter();
      }
      
      const success = await printerRef.current.connect();
      setIsConnected(success);
      
      if (!success) {
        setError('Failed to connect to printer');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, []);

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

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    printReceipt,
  };
};
