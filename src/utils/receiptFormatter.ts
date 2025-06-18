
import { ESC_POS } from './thermalPrinter';
import { generateBarcodeForPrinter } from './barcodeGenerator';
import { format } from 'date-fns';

export interface ReceiptData {
  vehicleNumber: string;
  vehicleType: 'cycle' | 'two-wheeler' | 'three-wheeler' | 'four-wheeler';
  entryDate: Date;
  entryTime: Date;
  amount: number;
  helmet: boolean;
}

export function formatReceipt(data: ReceiptData): string {
  const { vehicleNumber, vehicleType, entryDate, entryTime, amount, helmet } = data;
  
  // Format date and time
  const formattedDate = format(entryDate, 'MMMM d, yyyy');
  const formattedTime = format(entryTime, 'hh:mm a');
  
  // Format vehicle type for display
  const displayVehicleType = vehicleType.replace('-', ' ').toUpperCase();
  
  let receipt = '';
  
  // Initialize and center alignment
  receipt += ESC_POS.INIT;
  receipt += ESC_POS.CENTER;
  
  // Header section
  receipt += ESC_POS.BOLD_ON;
  receipt += 'WELCOME TO SOUTH EASTERN RAILWAY';
  receipt += ESC_POS.BOLD_OFF;
  receipt += ESC_POS.LF;
  receipt += 'TATA NAGAR PARKING';
  receipt += ESC_POS.LF;
  receipt += ESC_POS.LF;
  
  // Vehicle details section - left aligned
  receipt += ESC_POS.LEFT;
  receipt += `VEHICLE NO: ${vehicleNumber.toUpperCase()}`;
  receipt += ESC_POS.LF;
  receipt += `VEHICLE TYPE: ${displayVehicleType}`;
  receipt += ESC_POS.LF;
  receipt += `ENTRY DATE: ${formattedDate}`;
  receipt += ESC_POS.LF;
  receipt += `ENTRY TIME: ${formattedTime}`;
  receipt += ESC_POS.LF;
  
  // Amount section
  let amountText = `AMOUNT: ₹${amount}`;
  if (helmet && (vehicleType === 'cycle' || vehicleType === 'two-wheeler')) {
    amountText += ' (includes helmet ₹2)';
  }
  receipt += amountText;
  receipt += ESC_POS.LF;
  receipt += ESC_POS.LF;
  
  // Barcode section
  receipt += generateBarcodeForPrinter(vehicleNumber);
  receipt += ESC_POS.LF;
  
  // Footer section - centered
  receipt += ESC_POS.CENTER;
  receipt += 'Please Pay at the Exit.';
  receipt += ESC_POS.LF;
  receipt += 'Valid for 6 Hours.';
  receipt += ESC_POS.LF;
  
  return receipt;
}

// Calculate 6-hour initial charge
export function calculate6HourCharge(
  vehicleType: 'cycle' | 'two-wheeler' | 'three-wheeler' | 'four-wheeler',
  helmet: boolean
): number {
  let baseAmount = 0;
  
  switch (vehicleType) {
    case 'cycle':
      baseAmount = 5; // 2-6 hrs rate
      break;
    case 'two-wheeler':
      baseAmount = 10; // 0-6 hrs rate
      break;
    case 'three-wheeler':
      baseAmount = 30; // 0-6 hrs rate
      break;
    case 'four-wheeler':
      baseAmount = 40; // 0-6 hrs rate
      break;
  }
  
  // Add helmet charge if applicable
  if (helmet && (vehicleType === 'cycle' || vehicleType === 'two-wheeler')) {
    baseAmount += 2;
  }
  
  return baseAmount;
}
