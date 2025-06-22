
# Node.js Printer Server Setup Instructions

## Overview
This Node.js server acts as a bridge between the web application and your USB001 thermal printer. It exposes HTTP endpoints that the web app can call to print receipts.

## Required Dependencies
Create a new Node.js project and install these packages:

```bash
npm init -y
npm install express cors printer
```

## Server Code (server.js)
```javascript
const express = require('express');
const cors = require('cors');
const printer = require('printer');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let printerConnected = false;

// Check if USB001 printer is available
function checkPrinterStatus() {
  const printers = printer.getPrinters();
  const usbPrinter = printers.find(p => p.name.includes('USB001') || p.name.includes('TVS'));
  printerConnected = !!usbPrinter;
  return { connected: printerConnected, printers: printers.map(p => p.name) };
}

// Get printer status
app.get('/printer/status', (req, res) => {
  const status = checkPrinterStatus();
  res.json(status);
});

// Connect to printer (status check)
app.post('/printer/connect', (req, res) => {
  const status = checkPrinterStatus();
  res.json(status);
});

// Disconnect printer
app.post('/printer/disconnect', (req, res) => {
  printerConnected = false;
  res.json({ success: true, connected: false });
});

// Print receipt
app.post('/printer/print', (req, res) => {
  try {
    const { data, printerPort } = req.body;
    
    if (!data) {
      return res.status(400).json({ success: false, error: 'No data provided' });
    }

    // Find USB001 printer
    const printers = printer.getPrinters();
    const targetPrinter = printers.find(p => 
      p.name.includes('USB001') || 
      p.name.includes('TVS') ||
      p.name.toLowerCase().includes('thermal')
    );

    if (!targetPrinter) {
      return res.status(404).json({ 
        success: false, 
        error: 'USB001 thermal printer not found',
        availablePrinters: printers.map(p => p.name)
      });
    }

    // Print the raw ESC/POS data
    printer.printDirect({
      data: data,
      printer: targetPrinter.name,
      type: 'RAW',
      success: function(jobID) {
        console.log('Print job sent successfully. Job ID:', jobID);
      },
      error: function(err) {
        console.error('Print error:', err);
      }
    });

    res.json({ success: true, printer: targetPrinter.name });
    
  } catch (error) {
    console.error('Print error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Printer server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- GET /printer/status');
  console.log('- POST /printer/connect');
  console.log('- POST /printer/disconnect');
  console.log('- POST /printer/print');
  
  // Initial printer check
  const status = checkPrinterStatus();
  console.log('Printer status:', status);
});
```

## Setup Steps

1. Create a new directory for the server:
   ```bash
   mkdir printer-server
   cd printer-server
   ```

2. Initialize npm and install dependencies:
   ```bash
   npm init -y
   npm install express cors printer
   ```

3. Create server.js with the code above

4. Run the server:
   ```bash
   node server.js
   ```

5. The server will run on http://localhost:3001

## Testing the Server

Test the endpoints using curl or Postman:

```bash
# Check printer status
curl http://localhost:3001/printer/status

# Test print (with sample ESC/POS data)
curl -X POST http://localhost:3001/printer/print \
  -H "Content-Type: application/json" \
  -d '{"data":"Hello World\n\n\n", "printerPort":"USB001"}'
```

## Troubleshooting

1. **Printer not found**: Make sure your TVS RP3230 is connected and recognized by the system
2. **Permission issues**: On Linux/Mac, you might need to run with sudo
3. **CORS errors**: The server includes CORS headers to allow web app communication
4. **Print jobs not working**: Check that the printer driver is properly installed

## Security Notes

- This server runs locally and should only be used on trusted networks
- Consider adding authentication for production use
- The server exposes printer access to any application that can reach it
