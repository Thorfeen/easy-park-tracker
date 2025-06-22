
// HTTP API communication for Node.js server handling USB001 printer
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
  private serverUrl: string;
  private isConnectedFlag: boolean = false;

  constructor(serverUrl: string = 'http://localhost:3001') {
    this.serverUrl = serverUrl;
  }

  async connect(): Promise<boolean> {
    try {
      // Test connection to Node.js server
      const response = await fetch(`${this.serverUrl}/printer/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.isConnectedFlag = data.connected || false;
        return this.isConnectedFlag;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to connect to printer server:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await fetch(`${this.serverUrl}/printer/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      this.isConnectedFlag = false;
    } catch (error) {
      console.error('Error disconnecting from printer server:', error);
    }
  }

  isConnected(): boolean {
    return this.isConnectedFlag;
  }

  async printReceipt(receiptData: string): Promise<boolean> {
    try {
      if (!this.isConnected()) {
        throw new Error('Printer server not connected');
      }

      const response = await fetch(`${this.serverUrl}/printer/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: receiptData,
          printerPort: 'USB001'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.success || false;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to print receipt:', error);
      return false;
    }
  }

  setServerUrl(url: string): void {
    this.serverUrl = url;
  }

  getServerUrl(): string {
    return this.serverUrl;
  }
}
