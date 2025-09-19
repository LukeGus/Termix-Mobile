import React, { useRef, useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';
import { getCurrentServerUrl } from '../../main-axios';

interface TerminalProps {
  hostConfig: {
    id: number;
    name: string;
    ip: string;
    port: number;
    username: string;
    authType: 'password' | 'key' | 'credential';
    password?: string;
    key?: string;
    keyPassword?: string;
    keyType?: string;
    credentialId?: number;
  };
  isVisible: boolean;
  title?: string;
}

export const Terminal: React.FC<TerminalProps> = ({
  hostConfig,
  isVisible,
  title = 'Terminal'
}) => {
  const webViewRef = useRef<WebView>(null);
  const [webViewKey, setWebViewKey] = useState(0);

  const getWebSocketUrl = () => {
    const serverUrl = getCurrentServerUrl();

    if (!serverUrl) {
      return;
    }

    const wsProtocol = serverUrl.startsWith('https://') ? 'wss://' : 'ws://';
    const wsHost = serverUrl.replace(/^https?:\/\//, '');

    const cleanHost = wsHost.replace(/\/$/, '');
    return `${wsProtocol}${cleanHost}/ssh/websocket/`;
  };

  const generateHTML = () => {
    const wsUrl = getWebSocketUrl();
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terminal</title>
  <script src="https://unpkg.com/xterm@5.3.0/lib/xterm.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/xterm@5.3.0/css/xterm.css" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');
    
    body {
      margin: 0;
      padding: 0;
      background-color: #09090b;
      font-family: 'JetBrains Mono', 'MesloLGS NF', 'FiraCode Nerd Font', 'Cascadia Code', 'JetBrains Mono', Consolas, 'Courier New', monospace;
      overflow: hidden;
    }
    
    #terminal {
      width: 100vw;
      height: 100vh;
    }
    
    .xterm {
      font-feature-settings: "liga" 1, "calt" 1;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    .xterm .xterm-screen {
      font-family: 'JetBrains Mono', 'MesloLGS NF', 'FiraCode Nerd Font', 'Cascadia Code', 'JetBrains Mono', Consolas, "Courier New", monospace !important;
      font-variant-ligatures: contextual;
    }
    
    .xterm .xterm-viewport::-webkit-scrollbar {
      width: 8px;
      background: transparent;
    }
    .xterm .xterm-viewport::-webkit-scrollbar-thumb {
      background: rgba(180,180,180,0.7);
      border-radius: 4px;
    }
    .xterm .xterm-viewport::-webkit-scrollbar-thumb:hover {
      background: rgba(120,120,120,0.9);
    }
    .xterm .xterm-viewport {
      scrollbar-width: thin;
      scrollbar-color: rgba(180,180,180,0.7) transparent;
    }
  </style>
</head>
<body>
  <div id="terminal"></div>
  
  <script>
    const terminal = new Terminal({
      cursorBlink: false,
      cursorStyle: 'bar',
      scrollback: 10000,
      fontSize: 14,
      fontFamily: '"JetBrains Mono", "MesloLGS NF", "FiraCode Nerd Font", "Cascadia Code", "JetBrains Mono", Consolas, "Courier New", monospace',
      theme: { 
        background: '#09090b', 
        foreground: '#f7f7f7',
        cursor: '#f7f7f7',
        selection: 'rgba(255, 255, 255, 0.3)'
      },
      allowTransparency: true,
      convertEol: true,
      windowsMode: false,
      macOptionIsMeta: false,
      macOptionClickForcesSelection: false,
      rightClickSelectsWord: false,
      fastScrollModifier: 'alt',
      fastScrollSensitivity: 5,
      allowProposedApi: true,
      disableStdin: false,
      cursorInactiveStyle: 'bar'
    });

    // Open terminal
    terminal.open(document.getElementById('terminal'));
    
    // Host configuration from React Native
    const hostConfig = ${JSON.stringify(hostConfig)};
    const wsUrl = '${wsUrl}';
    
    console.log('Connecting to WebSocket:', wsUrl);
    console.log('Host config:', hostConfig);
    
    let ws = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let reconnectTimeout = null;
    
    // WebSocket connection function
    function connectWebSocket() {
      try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = function() {
          console.log('WebSocket connected');
          reconnectAttempts = 0;
          
          // Send initial connection message
          const connectMessage = {
            type: 'connectToHost',
            data: {
              cols: terminal.cols,
              rows: terminal.rows,
              hostConfig: hostConfig
            }
          };
          
          ws.send(JSON.stringify(connectMessage));
          
          // Set up terminal input handler
          terminal.onData(function(data) {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'input', data: data }));
            }
          });
          
          // Start ping interval
          startPingInterval();
        };
        
        ws.onmessage = function(event) {
          try {
            const msg = JSON.parse(event.data);
            
            if (msg.type === 'data') {
              terminal.write(msg.data);
            } else if (msg.type === 'error') {
              terminal.writeln('\\r\\n[ERROR] ' + msg.message);
            } else if (msg.type === 'connected') {
              terminal.writeln('\\r\\n[CONNECTED] SSH connection established');
            } else if (msg.type === 'disconnected') {
              terminal.writeln('\\r\\n[DISCONNECTED] ' + (msg.message || 'SSH connection closed'));
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        ws.onclose = function(event) {
          console.log('WebSocket closed:', event.code, event.reason);
          terminal.writeln('\\r\\n[CONNECTION CLOSED] WebSocket connection lost');
          stopPingInterval();
          
          // Attempt to reconnect
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
            console.log('Attempting to reconnect in', delay, 'ms (attempt', reconnectAttempts, '/', maxReconnectAttempts, ')');
            
            reconnectTimeout = setTimeout(() => {
              connectWebSocket();
            }, delay);
          } else {
            terminal.writeln('\\r\\n[RECONNECT FAILED] Maximum reconnection attempts reached');
          }
        };
        
        ws.onerror = function(error) {
          console.error('WebSocket error:', error);
          terminal.writeln('\\r\\n[CONNECTION ERROR] WebSocket connection failed');
        };
        
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        terminal.writeln('\\r\\n[ERROR] Failed to create WebSocket connection: ' + error.message);
      }
    }
    
    // Ping interval to keep connection alive
    let pingInterval = null;
    
    function startPingInterval() {
      stopPingInterval();
      pingInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    }
    
    function stopPingInterval() {
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
    }
    
    // Handle terminal resize
    function handleResize() {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'resize',
          data: { cols: terminal.cols, rows: terminal.rows }
        }));
      }
    }
    
    // Listen for resize events
    window.addEventListener('resize', handleResize);
    
    // Initial connection
    connectWebSocket();
    
    // Cleanup function
    window.addEventListener('beforeunload', function() {
      stopPingInterval();
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
      }
    });
    
    // Focus terminal
    terminal.focus();
  </script>
</body>
</html>
    `;
  };

  // Force WebView refresh when hostConfig changes
  useEffect(() => {
    setWebViewKey(prev => prev + 1);
  }, [hostConfig.id]);

  if (!isVisible) {
    return null;
  }

  return (
    <WebView
      key={webViewKey}
      ref={webViewRef}
      source={{ html: generateHTML() }}
      style={{ flex: 1, backgroundColor: '#09090b' }}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={false}
      scalesPageToFit={false}
      allowsInlineMediaPlayback={true}
      mediaPlaybackRequiresUserAction={false}
      onError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.error('WebView error:', nativeEvent);
      }}
      onHttpError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.error('WebView HTTP error:', nativeEvent);
      }}
    />
  );
};

export default Terminal;
