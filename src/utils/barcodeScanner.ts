
// WebHID API type definitions
interface HIDDevice {
  vendorId: number;
  productId: number;
  productName: string;
  opened: boolean;
  open(): Promise<void>;
  close(): Promise<void>;
  addEventListener(type: string, listener: (event: any) => void): void;
  removeEventListener(type: string, listener: (event: any) => void): void;
}

interface HIDInputReportEvent {
  data: DataView;
  device: HIDDevice;
  reportId: number;
}

interface HID {
  requestDevice(options: { filters: Array<{ vendorId?: number; productId?: number }> }): Promise<HIDDevice[]>;
}

declare global {
  interface Navigator {
    hid: HID;
  }
}

// TVS 103G Barcode Scanner Integration
export interface BarcodeData {
  value: string;
  timestamp: Date;
}

export class BarcodeScanner {
  private device: HIDDevice | null = null;
  private onScanCallback: ((data: BarcodeData) => void) | null = null;

  async connect(): Promise<boolean> {
    try {
      if (!('hid' in navigator)) {
        throw new Error('WebHID API not supported');
      }

      // Request HID device with TVS 103G scanner vendor/product IDs
      const devices = await navigator.hid.requestDevice({
        filters: [
          { vendorId: 0x0DD4 }, // TVS vendor ID
          { vendorId: 0x05FE }, // Alternative vendor ID for barcode scanners
          { vendorId: 0x1A86 }, // Another common vendor ID
        ]
      });

      if (devices.length === 0) {
        throw new Error('No barcode scanner found');
      }

      this.device = devices[0];
      await this.device.open();

      // Set up input report listener
      this.device.addEventListener('inputreport', this.handleInputReport.bind(this));

      return true;
    } catch (error) {
      console.error('Failed to connect to barcode scanner:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.device) {
        this.device.removeEventListener('inputreport', this.handleInputReport.bind(this));
        await this.device.close();
        this.device = null;
      }
      this.onScanCallback = null;
    } catch (error) {
      console.error('Error disconnecting barcode scanner:', error);
    }
  }

  isConnected(): boolean {
    return this.device !== null && this.device.opened;
  }

  onScan(callback: (data: BarcodeData) => void): void {
    this.onScanCallback = callback;
  }

  private handleInputReport(event: HIDInputReportEvent): void {
    const { data, device, reportId } = event;
    
    try {
      // Convert the data to a string (barcode scanners typically send ASCII data)
      let scannedText = '';
      const dataView = new DataView(data.buffer);
      
      // Skip the first byte (usually report ID) and process the rest
      for (let i = 1; i < dataView.byteLength; i++) {
        const byte = dataView.getUint8(i);
        if (byte > 0 && byte < 128) { // Valid ASCII range
          scannedText += String.fromCharCode(byte);
        }
      }

      // Clean up the scanned text (remove whitespace and control characters)
      scannedText = scannedText.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '');

      if (scannedText && this.onScanCallback) {
        this.onScanCallback({
          value: scannedText,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error processing barcode scan:', error);
    }
  }
}
