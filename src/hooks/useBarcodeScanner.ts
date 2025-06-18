
import { useState, useCallback, useRef, useEffect } from 'react';
import { BarcodeScanner, BarcodeData } from '@/utils/barcodeScanner';

export const useBarcodeScanner = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<BarcodeData | null>(null);
  const scannerRef = useRef<BarcodeScanner | null>(null);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      if (!scannerRef.current) {
        scannerRef.current = new BarcodeScanner();
      }
      
      const success = await scannerRef.current.connect();
      setIsConnected(success);
      
      if (!success) {
        setError('Failed to connect to barcode scanner');
      } else {
        // Set up scan handler
        scannerRef.current.onScan((data: BarcodeData) => {
          setLastScan(data);
        });
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
      if (scannerRef.current) {
        await scannerRef.current.disconnect();
        setIsConnected(false);
        setLastScan(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    }
  }, []);

  const clearLastScan = useCallback(() => {
    setLastScan(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.disconnect();
      }
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    error,
    lastScan,
    connect,
    disconnect,
    clearLastScan,
  };
};
