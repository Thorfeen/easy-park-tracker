
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

// WebUSB API type definitions for TVS RP3230
interface USBDevice {
  vendorId: number;
  productId: number;
  productName: string;
  opened: boolean;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>;
}

interface USBOutTransferResult {
  bytesWritten: number;
  status: 'ok' | 'stall' | 'babble';
}

interface USB {
  requestDevice(options: { filters: Array<{ vendorId?: number; productId?: number }> }): Promise<USBDevice>;
}

declare global {
  interface Navigator {
    usb: USB;
  }
}

export class ThermalPrinter {
  private device: USBDevice | null = null;
  private interfaceNumber = 0;
  private endpointNumber = 1; // Typical OUT endpoint for printers

  async connect(): Promise<boolean> {
    try {
      if (!('usb' in navigator)) {
        throw new Error('WebUSB API not supported');
      }

      // Request USB device with TVS RP3230 vendor/product IDs
      this.device = await navigator.usb.requestDevice({
        filters: [
          { vendorId: 0x0DD4 }, // TVS vendor ID
          { vendorId: 0x04b8 }, // Alternative vendor ID for thermal printers
          { vendorId: 0x154f }, // Another common vendor ID
        ]
      });

      await this.device.open();
      
      // Select configuration (usually configuration 1)
      await this.device.selectConfiguration(1);
      
      // Claim interface (usually interface 0 for printers)
      await this.device.claimInterface(this.interfaceNumber);
      
      // Initialize printer
      await this.sendCommand(ESC_POS.INIT);
      
      return true;
    } catch (error) {
      console.error('Failed to connect to USB printer:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.device) {
        await this.device.releaseInterface(this.interfaceNumber);
        await this.device.close();
        this.device = null;
      }
    } catch (error) {
      console.error('Error disconnecting USB printer:', error);
    }
  }

  isConnected(): boolean {
    return this.device !== null && this.device.opened;
  }

  private async sendCommand(command: string): Promise<void> {
    if (!this.device) {
      throw new Error('Printer not connected');
    }
    
    const encoder = new TextEncoder();
    const data = encoder.encode(command);
    
    const result = await this.device.transferOut(this.endpointNumber, data);
    
    if (result.status !== 'ok') {
      throw new Error(`USB transfer failed with status: ${result.status}`);
    }
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
