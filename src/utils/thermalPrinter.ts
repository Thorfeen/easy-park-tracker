
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

export interface PrinterPort {
  readable: ReadableStream;
  writable: WritableStream;
  close(): Promise<void>;
}

export class ThermalPrinter {
  private port: PrinterPort | null = null;
  private writer: WritableStreamDefaultWriter | null = null;

  async connect(): Promise<boolean> {
    try {
      if (!('serial' in navigator)) {
        throw new Error('Web Serial API not supported');
      }

      // Request port with TVS RP3230 vendor/product IDs
      this.port = await (navigator as any).serial.requestPort({
        filters: [
          { usbVendorId: 0x0DD4 }, // TVS vendor ID
        ]
      });

      await this.port.open({ 
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      });

      this.writer = this.port.writable.getWriter();
      
      // Initialize printer
      await this.sendCommand(ESC_POS.INIT);
      
      return true;
    } catch (error) {
      console.error('Failed to connect to printer:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.writer) {
        await this.writer.close();
        this.writer = null;
      }
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
    } catch (error) {
      console.error('Error disconnecting printer:', error);
    }
  }

  isConnected(): boolean {
    return this.port !== null && this.writer !== null;
  }

  private async sendCommand(command: string): Promise<void> {
    if (!this.writer) {
      throw new Error('Printer not connected');
    }
    
    const encoder = new TextEncoder();
    await this.writer.write(encoder.encode(command));
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
}
