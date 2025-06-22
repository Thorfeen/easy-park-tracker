
// ESC/POS Commands for TVS RP3230 Thermal Printer
export const ESC_POS = {
  // Text formatting
  BOLD_ON: '\x1b\x45\x01',
  BOLD_OFF: '\x1b\x45\x00',
  CENTER: '\x1b\x61\x01',
  LEFT: '\x1b\x61\x00',
  
  // Line feeds
  LF: '\x0a',
  CR: '\x0d',
  CRLF: '\x0d\x0a',
  
  // Paper control
  CUT: '\x1d\x56\x00',
  
  // Initialize printer
  INIT: '\x1b\x40',
  
  // Font size
  NORMAL_SIZE: '\x1d\x21\x00',
  DOUBLE_HEIGHT: '\x1d\x21\x01',
};

export class ThermalPrinter {
  private socket: WebSocket | null = null;
  private printerIP: string = '';

  async connect(printerIP?: string): Promise<boolean> {
    try {
      // Use provided IP or prompt user for IP address
      if (printerIP) {
        this.printerIP = printerIP;
      } else {
        const ip = prompt('Enter printer IP address (e.g., 192.168.1.100):');
        if (!ip) {
          throw new Error('Printer IP address is required');
        }
        this.printerIP = ip;
      }

      // Create WebSocket connection to proxy server or direct TCP connection
      // Note: Direct TCP connections from browser aren't possible due to security restrictions
      // This implementation assumes you have a WebSocket-to-TCP proxy server
      const wsUrl = `ws://${window.location.hostname}:8080/printer/${this.printerIP}/9100`;
      
      return new Promise((resolve, reject) => {
        try {
          this.socket = new WebSocket(wsUrl);
          
          this.socket.onopen = () => {
            console.log('Connected to printer via WebSocket proxy');
            // Initialize printer
            this.sendCommand(ESC_POS.INIT);
            resolve(true);
          };
          
          this.socket.onerror = (error) => {
            console.error('WebSocket connection error:', error);
            reject(new Error('Failed to connect to printer'));
          };
          
          this.socket.onclose = () => {
            console.log('WebSocket connection closed');
            this.socket = null;
          };
          
          // Set timeout for connection
          setTimeout(() => {
            if (this.socket?.readyState !== WebSocket.OPEN) {
              this.socket?.close();
              reject(new Error('Connection timeout'));
            }
          }, 5000);
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      console.error('Failed to connect to printer:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
    } catch (error) {
      console.error('Error disconnecting printer:', error);
    }
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  private async sendCommand(command: string): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('Printer not connected');
    }
    
    // Send ESC/POS command as binary data
    const encoder = new TextEncoder();
    const data = encoder.encode(command);
    this.socket.send(data);
  }

  async printReceipt(receiptData: string): Promise<boolean> {
    try {
      if (!this.isConnected()) {
        throw new Error('Printer not connected');
      }

      await this.sendCommand(receiptData);
      await this.sendCommand(ESC_POS.LF + ESC_POS.LF + ESC_POS.CUT);
      
      return true;
    } catch (error) {
      console.error('Failed to print receipt:', error);
      return false;
    }
  }

  // Alternative method for direct TCP connection (requires backend proxy)
  async connectDirectTCP(printerIP: string): Promise<boolean> {
    try {
      // This would require a backend service to handle TCP connections
      const response = await fetch('/api/printer/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ip: printerIP,
          port: 9100
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect to printer via backend');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Direct TCP connection failed:', error);
      return false;
    }
  }

  async printDirectTCP(receiptData: string): Promise<boolean> {
    try {
      const response = await fetch('/api/printer/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: receiptData + ESC_POS.LF + ESC_POS.LF + ESC_POS.CUT
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to print via backend');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Direct TCP print failed:', error);
      return false;
    }
  }
}
