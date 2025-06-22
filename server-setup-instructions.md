
# Node.js Printer Server Setup Instructions

## Overview
This Node.js server acts as a bridge between the web application and your USB001 thermal printer using the reliable `node-thermal-printer` package. It exposes HTTP endpoints that the web app can call to print receipts.

## Required Dependencies
Create a new Node.js project and install these packages:

```bash
npm init -y
npm install express cors node-thermal-printer
```

## Server Code (server.js)
```javascript
const express = require('express');
const cors = require('cors');
const { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } = require('node-thermal-printer');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let printer = null;
let printerConnected = false;

// Initialize thermal printer
function initializePrinter() {
  try {
    printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,  // Most thermal printers are EPSON compatible
      interface: 'printer:USB001', // Windows USB printer interface
      characterSet: CharacterSet.PC852_LATIN2,
      removeSpecialCharacters: false,
      lineCharacter: "=",
      breakLine: BreakLine.WORD,
      options: {
        timeout: 5000,
      }
    });
    
    console.log('Thermal printer initialized for USB001');
    return true;
  } catch (error) {
    console.error('Failed to initialize printer:', error);
    return false;
  }
}

// Check printer status and connectivity
async function checkPrinterStatus() {
  try {
    if (!printer) {
      const initialized = initializePrinter();
      if (!initialized) {
        return { connected: false, error: 'Failed to initialize printer' };
      }
    }

    // Test printer connection
    const isConnected = await printer.isPrinterConnected();
    printerConnected = isConnected;
    
    return { 
      connected: isConnected, 
      printerType: printer.config.type,
      interface: printer.config.interface 
    };
  } catch (error) {
    console.error('Printer status check failed:', error);
    printerConnected = false;
    return { connected: false, error: error.message };
  }
}

// Get printer status
app.get('/printer/status', async (req, res) => {
  const status = await checkPrinterStatus();
  res.json(status);
});

// Connect to printer
app.post('/printer/connect', async (req, res) => {
  const status = await checkPrinterStatus();
  res.json(status);
});

// Disconnect printer
app.post('/printer/disconnect', async (req, res) => {
  try {
    if (printer) {
      await printer.clear();
    }
    printerConnected = false;
    res.json({ success: true, connected: false });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.json({ success: true, connected: false, warning: error.message });
  }
});

// Print receipt with raw ESC/POS data
app.post('/printer/print', async (req, res) => {
  try {
    const { data, printerPort } = req.body;
    
    if (!data) {
      return res.status(400).json({ success: false, error: 'No data provided' });
    }

    if (!printer) {
      const initialized = initializePrinter();
      if (!initialized) {
        return res.status(500).json({ success: false, error: 'Failed to initialize printer' });
      }
    }

    // Check if printer is connected
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      return res.status(404).json({ 
        success: false, 
        error: 'USB001 thermal printer not connected or not found'
      });
    }

    // Clear any previous content
    printer.clear();
    
    // Send raw ESC/POS data directly
    printer.raw(Buffer.from(data, 'binary'));
    
    // Execute the print job
    const success = await printer.execute();
    
    if (success) {
      console.log('Print job executed successfully');
      res.json({ success: true, printer: 'USB001' });
    } else {
      res.status(500).json({ success: false, error: 'Print execution failed' });
    }
    
  } catch (error) {
    console.error('Print error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test print endpoint for debugging
app.post('/printer/test', async (req, res) => {
  try {
    if (!printer) {
      const initialized = initializePrinter();
      if (!initialized) {
        return res.status(500).json({ success: false, error: 'Failed to initialize printer' });
      }
    }

    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      return res.status(404).json({ 
        success: false, 
        error: 'Printer not connected'
      });
    }

    printer.clear();
    printer.alignCenter();
    printer.println('TEST PRINT');
    printer.println('Node Thermal Printer');
    printer.println('USB001 Connection');
    printer.drawLine();
    printer.newLine();
    printer.cut();
    
    const success = await printer.execute();
    
    if (success) {
      res.json({ success: true, message: 'Test print completed' });
    } else {
      res.status(500).json({ success: false, error: 'Test print failed' });
    }
    
  } catch (error) {
    console.error('Test print error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, async () => {
  console.log(`Printer server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- GET /printer/status');
  console.log('- POST /printer/connect');
  console.log('- POST /printer/disconnect');
  console.log('- POST /printer/print');
  console.log('- POST /printer/test');
  
  // Initialize printer on startup
  console.log('Initializing thermal printer...');
  const status = await checkPrinterStatus();
  console.log('Printer status:', status);
});
```

## Setup Steps

1. Create a new directory for the server:
   ```bash
   mkdir thermal-printer-server
   cd thermal-printer-server
   ```

2. Initialize npm and install dependencies:
   ```bash
   npm init -y
   npm install express cors node-thermal-printer
   ```

3. Create server.js with the code above

4. Make sure your TVS RP3230 printer is:
   - Connected via USB
   - Installed and recognized by Windows
   - Set as "USB001" in Windows printer settings

5. Run the server:
   ```bash
   node server.js
   ```

6. The server will run on http://localhost:3001

## Testing the Server

Test the endpoints using curl or Postman:

```bash
# Check printer status
curl http://localhost:3001/printer/status

# Test basic connectivity
curl -X POST http://localhost:3001/printer/connect

# Test print functionality
curl -X POST http://localhost:3001/printer/test

# Test with ESC/POS data
curl -X POST http://localhost:3001/printer/print \
  -H "Content-Type: application/json" \
  -d "{\"data\":\"\\x1b\\x40Hello World\\x0a\\x0a\\x0a\\x1d\\x56\\x00\", \"printerPort\":\"USB001\"}"
```

## Key Improvements

1. **Better Windows Support**: `node-thermal-printer` has excellent Windows USB support
2. **Modern API**: Uses async/await and proper error handling
3. **Printer Detection**: Automatically detects if printer is connected
4. **Raw ESC/POS Support**: Can handle raw ESC/POS commands from your web app
5. **Test Endpoint**: Built-in test functionality for debugging
6. **Better Error Messages**: More descriptive error reporting

## Troubleshooting

1. **Printer not found**: 
   - Ensure USB001 is the correct printer name in Windows
   - Check Windows Device Manager for the printer
   - Try restarting the printer service: `net stop spooler && net start spooler`

2. **Permission issues**: 
   - Run command prompt as Administrator when starting the server
   - Ensure printer drivers are properly installed

3. **Connection timeouts**: 
   - Check if another application is using the printer
   - Restart both the printer and the server

4. **Print quality issues**: 
   - Adjust the CharacterSet in the printer configuration
   - Try different PrinterTypes (EPSON, STAR, etc.)

## Security Notes

- This server runs locally and should only be used on trusted networks
- Consider adding authentication for production environments
- The server provides direct printer access to authorized applications

