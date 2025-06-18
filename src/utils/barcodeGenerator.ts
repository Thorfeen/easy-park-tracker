
import JsBarcode from 'jsbarcode';
import { ESC_POS } from './thermalPrinter';

export function generateBarcodeForPrinter(vehicleNumber: string): string {
  try {
    // Create a canvas element to generate barcode
    const canvas = document.createElement('canvas');
    
    // Generate Code128 barcode
    JsBarcode(canvas, vehicleNumber, {
      format: 'CODE128',
      width: 2,
      height: 50,
      displayValue: false,
      margin: 0
    });

    // Convert canvas to image data for thermal printer
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Convert to ESC/POS bitmap format (simplified)
    // This is a basic implementation - for production, you might need more sophisticated bitmap conversion
    let bitmapCommand = '\x1d\x76\x30\x00'; // GS v 0 - print raster bitmap
    
    // Add bitmap width and height (little endian)
    const width = canvas.width;
    const height = canvas.height;
    bitmapCommand += String.fromCharCode(width % 256, Math.floor(width / 256));
    bitmapCommand += String.fromCharCode(height % 256, Math.floor(height / 256));
    
    // Convert image data to monochrome bitmap
    const pixels = imageData.data;
    let bitmapData = '';
    
    for (let y = 0; y < height; y++) {
      let byte = 0;
      let bitCount = 0;
      
      for (let x = 0; x < width; x++) {
        const pixelIndex = (y * width + x) * 4;
        const r = pixels[pixelIndex];
        const g = pixels[pixelIndex + 1];
        const b = pixels[pixelIndex + 2];
        
        // Convert to grayscale and threshold
        const gray = (r + g + b) / 3;
        const bit = gray < 128 ? 1 : 0;
        
        byte = (byte << 1) | bit;
        bitCount++;
        
        if (bitCount === 8) {
          bitmapData += String.fromCharCode(byte);
          byte = 0;
          bitCount = 0;
        }
      }
      
      // Pad remaining bits if width is not divisible by 8
      if (bitCount > 0) {
        byte = byte << (8 - bitCount);
        bitmapData += String.fromCharCode(byte);
      }
    }
    
    return ESC_POS.CENTER + bitmapCommand + bitmapData + ESC_POS.LEFT;
  } catch (error) {
    console.error('Failed to generate barcode:', error);
    // Fallback: print vehicle number as text
    return ESC_POS.CENTER + `*${vehicleNumber}*` + ESC_POS.LF + ESC_POS.LEFT;
  }
}
