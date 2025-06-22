
# WebSocket-to-TCP Proxy Server Setup

This proxy server enables the web application to communicate with your TVS RP3230 thermal printer over TCP/IP via WebSocket connections.

## Prerequisites

- Node.js (version 14 or higher)
- Your TVS RP3230 printer connected to the network
- Printer IP address and port 9100 accessible

## Server Setup

### 1. Create a new directory for the proxy server

```bash
mkdir thermal-printer-proxy
cd thermal-printer-proxy
```

### 2. Initialize npm and install dependencies

```bash
npm init -y
npm install ws net cors express
```

### 3. Create the proxy server file

Create `proxy-server.js` with the following content:

```javascript
const WebSocket = require('ws');
const net = require('net');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// WebSocket server for printer communication
const wss = new WebSocket.Server({ port: 8080 });

console.log('WebSocket-to-TCP Proxy Server starting on port 8080...');

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');
  
  // Extract printer IP and port from the URL path
  // Expected format: ws://localhost:8080/printer/192.168.1.100/9100
  const urlParts = req.url.split('/');
  const printerIP = urlParts[2];
  const printerPort = parseInt(urlParts[3]) || 9100;
  
  if (!printerIP) {
    console.error('No printer IP provided in WebSocket URL');
    ws.close(1000, 'Printer IP required');
    return;
  }
  
  console.log(`Attempting to connect to printer at ${printerIP}:${printerPort}`);
  
  // Create TCP connection to thermal printer
  const tcpSocket = new net.Socket();
  
  // Handle TCP connection success
  tcpSocket.connect(printerPort, printerIP, () => {
    console.log(`Connected to thermal printer at ${printerIP}:${printerPort}`);
    ws.send(JSON.stringify({ type: 'connected', message: 'Connected to printer' }));
  });
  
  // Handle data from printer (if any)
  tcpSocket.on('data', (data) => {
    console.log('Data received from printer:', data);
    // Forward printer response back to WebSocket client if needed
    ws.send(data);
  });
  
  // Handle TCP connection errors
  tcpSocket.on('error', (err) => {
    console.error('TCP connection error:', err.message);
    ws.send(JSON.stringify({ 
      type: 'error', 
      message: `Failed to connect to printer: ${err.message}` 
    }));
    ws.close();
  });
  
  // Handle TCP connection close
  tcpSocket.on('close', () => {
    console.log('TCP connection to printer closed');
    ws.close();
  });
  
  // Handle WebSocket messages (print commands)
  ws.on('message', (message) => {
    try {
      // Forward raw ESC/POS data to printer
      console.log('Sending data to printer:', message.length, 'bytes');
      tcpSocket.write(message);
    } catch (error) {
      console.error('Error sending data to printer:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: `Print error: ${error.message}` 
      }));
    }
  });
  
  // Handle WebSocket close
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    if (!tcpSocket.destroyed) {
      tcpSocket.destroy();
    }
  });
  
  // Handle WebSocket errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    if (!tcpSocket.destroyed) {
      tcpSocket.destroy();
    }
  });
});

// Optional: HTTP health check endpoint
const httpServer = express();
httpServer.use(cors());

httpServer.get('/health', (req, res) => {
  res.json({ 
    status: 'running', 
    message: 'WebSocket-to-TCP Proxy Server is healthy',
    port: 8080 
  });
});

httpServer.get('/test-printer/:ip', async (req, res) => {
  const printerIP = req.params.ip;
  const printerPort = 9100;
  
  try {
    const testSocket = new net.Socket();
    
    testSocket.connect(printerPort, printerIP, () => {
      console.log(`Test connection to ${printerIP}:${printerPort} successful`);
      testSocket.destroy();
      res.json({ 
        success: true, 
        message: `Printer at ${printerIP}:${printerPort} is reachable` 
      });
    });
    
    testSocket.on('error', (err) => {
      console.error(`Test connection failed: ${err.message}`);
      res.status(500).json({ 
        success: false, 
        message: `Cannot reach printer: ${err.message}` 
      });
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (!testSocket.destroyed) {
        testSocket.destroy();
        res.status(500).json({ 
          success: false, 
          message: 'Connection timeout' 
        });
      }
    }, 5000);
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Start HTTP server on port 8081 for health checks
httpServer.listen(8081, () => {
  console.log('HTTP health check server running on port 8081');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down proxy server...');
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});
```

### 4. Create package.json scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "start": "node proxy-server.js",
    "dev": "node proxy-server.js"
  }
}
```

### 5. Run the proxy server

```bash
npm start
```

## Testing the Setup

### 1. Test printer connectivity

Open your browser and navigate to:
```
http://localhost:8081/test-printer/YOUR_PRINTER_IP
```

Replace `YOUR_PRINTER_IP` with your actual printer IP address (e.g., `192.168.1.100`).

### 2. Test WebSocket connection

You can test the WebSocket connection using browser developer tools:

```javascript
const ws = new WebSocket('ws://localhost:8080/printer/192.168.1.100/9100');
ws.onopen = () => console.log('Connected');
ws.onmessage = (event) => console.log('Message:', event.data);
ws.onerror = (error) => console.error('Error:', error);
```

## Configuration

### Environment Variables (Optional)

You can create a `.env` file to configure the server:

```
WEBSOCKET_PORT=8080
HTTP_PORT=8081
DEFAULT_PRINTER_PORT=9100
DEBUG=true
```

### Firewall Configuration

Make sure your firewall allows:
- Incoming connections on port 8080 (WebSocket server)
- Incoming connections on port 8081 (HTTP health check)
- Outgoing connections to your printer's IP on port 9100

### Network Requirements

- The proxy server must be able to reach your printer's IP address
- Your web application must be able to connect to the proxy server
- If running on different machines, ensure network connectivity between all components

## Troubleshooting

### Common Issues

1. **Connection refused**: Check if the printer IP and port are correct
2. **WebSocket connection failed**: Verify the proxy server is running on port 8080
3. **Print data not received**: Check ESC/POS command formatting
4. **Network timeout**: Verify network connectivity to printer

### Debug Mode

To enable debug logging, set the `DEBUG` environment variable:

```bash
DEBUG=true npm start
```

### Logs

The server logs all connections and data transfers. Monitor the console output for:
- WebSocket connection attempts
- TCP connection status
- Data transmission logs
- Error messages

## Production Deployment

For production use:

1. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start proxy-server.js --name "printer-proxy"
   ```

2. Configure proper logging and monitoring
3. Set up SSL/TLS for secure WebSocket connections (WSS)
4. Implement authentication if needed
5. Configure firewall rules appropriately

## Integration with Web Application

Your web application should connect to the WebSocket proxy using:
```
ws://localhost:8080/printer/YOUR_PRINTER_IP/9100
```

The proxy will handle the TCP connection to your TVS RP3230 printer and forward all ESC/POS commands seamlessly.
```

