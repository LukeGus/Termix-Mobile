import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Dimensions } from 'react-native';
import { getCurrentServerUrl } from '../../main-axios';
import { showToast } from '../../utils/toast';

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
  onClose?: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({
  hostConfig,
  isVisible,
  title = 'Terminal',
  onClose
}) => {
  const webViewRef = useRef<WebView>(null);
  const [webViewKey, setWebViewKey] = useState(0);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [isConnecting, setIsConnecting] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle screen dimension changes for responsive design
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  // Handle connection failure and close tab
  const handleConnectionFailure = useCallback((errorMessage: string) => {
    showToast.error(errorMessage);
    setIsConnecting(false);
    setIsConnected(false);
    // Close the tab after a short delay
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 2000);
  }, [onClose]);

  const getWebSocketUrl = () => {
    const serverUrl = getCurrentServerUrl();

    if (!serverUrl) {
      showToast.error('No server URL found - please configure a server first');
      return null;
    }

    // Use proper protocol based on server URL
    const wsProtocol = serverUrl.startsWith('https://') ? 'wss://' : 'ws://';
    const wsHost = serverUrl.replace(/^https?:\/\//, '');
    const cleanHost = wsHost.replace(/\/$/, '');
    const wsUrl = `${wsProtocol}${cleanHost}/ssh/websocket/`;
    
    return wsUrl;
  };

  const generateHTML = useCallback(() => {
    const wsUrl = getWebSocketUrl();
    const { width, height } = screenDimensions;

    // Calculate proper terminal size based on screen dimensions
    const terminalWidth = Math.floor(width / 8); // Approximate character width
    const terminalHeight = Math.floor(height / 16); // Approximate character height

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terminal</title>
  <script src="https://unpkg.com/xterm@5.3.0/lib/xterm.js"></script>
  <script src="https://unpkg.com/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/xterm@5.3.0/css/xterm.css" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');
    
    body {
      margin: 0;
      padding: 0;
      background-color: #09090b;
      font-family: 'JetBrains Mono', 'MesloLGS NF', 'FiraCode Nerd Font', 'Cascadia Code', 'JetBrains Mono', Consolas, 'Courier New', monospace;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
    }
    
    #terminal {
      width: 100vw;
      height: 100vh;
      min-height: 100vh;
      padding: 4px;
      margin: 0;
      box-sizing: border-box;
    }
    
    .xterm {
      width: 100% !important;
      height: 100% !important;
    }
    
    .xterm-viewport {
      width: 100% !important;
      height: 100% !important;
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
    // Get screen dimensions
    const screenWidth = ${width};
    const screenHeight = ${height};
    
    // Calculate font size based on screen width - increased for better readability
    const baseFontSize = Math.max(14, Math.min(20, screenWidth / 25));
    
    const terminal = new Terminal({
      cursorBlink: false,
      cursorStyle: 'bar',
      scrollback: 10000,
      fontSize: baseFontSize,
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

    // Load fit addon
    const fitAddon = new FitAddon.FitAddon();
    terminal.loadAddon(fitAddon);
    
    // Open terminal
    terminal.open(document.getElementById('terminal'));
    
    // Fit terminal to container
    fitAddon.fit();
    
    // Host configuration from React Native
    const hostConfig = ${JSON.stringify(hostConfig)};
    const wsUrl = '${wsUrl}';
    
    let ws = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3; // 3 retries max as requested
    let reconnectTimeout = null;
    let connectionTimeout = null;
    
    // Notify React Native of connection state
    function notifyConnectionState(state, data = {}) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: state,
          data: data
        }));
      }
    }
    
    // WebSocket connection function
    function connectWebSocket() {
      try {
        notifyConnectionState('connecting', { retryCount: reconnectAttempts });
        
        ws = new WebSocket(wsUrl);
        
        // Set connection timeout
        connectionTimeout = setTimeout(() => {
          if (ws && ws.readyState === WebSocket.CONNECTING) {
            ws.close();
            notifyConnectionState('connectionFailed', { 
              hostName: hostConfig.name, 
              message: 'Connection timeout - server not responding' 
            });
          }
        }, 30000); // 30 second timeout
        
        ws.onopen = function() {
          clearTimeout(connectionTimeout);
          notifyConnectionState('connected', { hostName: hostConfig.name });
          
          // Send initial connection message with fitted dimensions
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
              // Check for authentication errors
              if (msg.message.toLowerCase().includes('password') || 
                  msg.message.toLowerCase().includes('authentication') ||
                  msg.message.toLowerCase().includes('permission denied')) {
                notifyConnectionState('connectionFailed', { 
                  hostName: hostConfig.name, 
                  message: 'Authentication failed: ' + msg.message 
                });
                return;
              }
            } else if (msg.type === 'connected') {
              // Don't show any bracket messages
            } else if (msg.type === 'disconnected') {
              notifyConnectionState('disconnected', { hostName: hostConfig.name });
            } else if (msg.type === 'pong') {
              // Server responded to ping - connection is alive
            }
          } catch (error) {
            // If it's not JSON, treat as raw terminal data
            terminal.write(event.data);
          }
        };
        
        ws.onclose = function(event) {
          clearTimeout(connectionTimeout);
          stopPingInterval();
          
          // Handle different close codes
          if (event.code === 1006) {
            notifyConnectionState('connectionFailed', { 
              hostName: hostConfig.name, 
              message: 'WebSocket connection failed (1006) - server not responding or URL incorrect' 
            });
            return;
          }
          
          // Attempt to reconnect only for unexpected closures
          if (event.code !== 1000 && event.code !== 1001 && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 5000);
            
            reconnectTimeout = setTimeout(() => {
              connectWebSocket();
            }, delay);
          } else {
            if (reconnectAttempts >= maxReconnectAttempts) {
              notifyConnectionState('connectionFailed', { 
                hostName: hostConfig.name, 
                message: 'Maximum reconnection attempts reached' 
              });
            }
          }
        };
        
        ws.onerror = function(error) {
          clearTimeout(connectionTimeout);
          notifyConnectionState('connectionFailed', { 
            hostName: hostConfig.name, 
            message: 'WebSocket connection failed - server may not be running' 
          });
        };
        
      } catch (error) {
        clearTimeout(connectionTimeout);
        notifyConnectionState('connectionFailed', { 
          hostName: hostConfig.name, 
          message: 'Failed to create WebSocket connection: ' + error.message 
        });
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
      }, 15000); // Ping every 15 seconds instead of 30
    }
    
    function stopPingInterval() {
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
    }
    
    // Handle terminal resize
    function handleResize() {
      // Fit terminal to new container size
      fitAddon.fit();
      
      // Send new dimensions to server
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'resize',
          data: { cols: terminal.cols, rows: terminal.rows }
        }));
      }
    }
    
    // Listen for resize events
    window.addEventListener('resize', handleResize);
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', function() {
      setTimeout(handleResize, 100); // Small delay for orientation change
    });
    
    // Initial connection
    connectWebSocket();
    
    // Cleanup function
    window.addEventListener('beforeunload', function() {
      stopPingInterval();
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
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
  }, [hostConfig, screenDimensions]);

  // Handle messages from WebView
  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'connecting':
          setIsConnecting(true);
          setRetryCount(message.data.retryCount);
          break;
          
        case 'connected':
          setIsConnecting(false);
          setIsConnected(true);
          setRetryCount(0);
          break;
          
        case 'disconnected':
          setIsConnecting(false);
          setIsConnected(false);
          showToast.warning(`Disconnected from ${message.data.hostName}`);
          // Close the tab after a short delay
          setTimeout(() => {
            if (onClose) {
              onClose();
            }
          }, 2000);
          break;
          
        case 'connectionFailed':
          handleConnectionFailure(`${message.data.hostName}: ${message.data.message}`);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  }, [handleConnectionFailure, onClose]);

  // Only refresh WebView when hostConfig actually changes (not when switching tabs)
  useEffect(() => {
    // Only recreate WebView if the host configuration has actually changed
    setWebViewKey(prev => prev + 1);
    setIsConnecting(true);
    setIsConnected(false);
    setRetryCount(0);
  }, [hostConfig.id]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, []);

  return (
    <View style={{ 
      flex: 1,
      width: '100%',
      height: '100%',
      opacity: isVisible ? 1 : 0, // Show/hide instead of recreating
      position: isVisible ? 'relative' : 'absolute',
      zIndex: isVisible ? 1 : -1,
    }}>
      {/* Always render WebView for connection */}
      <WebView
        key={`terminal-${hostConfig.id}-${webViewKey}`}
        ref={webViewRef}
        source={{ html: generateHTML() }}
        style={{ 
          flex: 1,
          width: '100%',
          height: '100%',
          backgroundColor: '#09090b',
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={false}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onMessage={handleWebViewMessage}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          handleConnectionFailure(`WebView error: ${nativeEvent.description}`);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          handleConnectionFailure(`WebView HTTP error: ${nativeEvent.statusCode}`);
        }}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={false}
      />
      
      {/* Show connecting overlay when connecting */}
      {isConnecting && !isConnected && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#09090b',
          padding: 20
        }}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={{
            color: '#ffffff',
            fontSize: 16,
            marginTop: 16,
            textAlign: 'center'
          }}>
            Connecting to {hostConfig.name}...
          </Text>
          {retryCount > 0 && (
            <Text style={{
              color: '#9CA3AF',
              fontSize: 14,
              marginTop: 8,
              textAlign: 'center'
            }}>
              Retry {retryCount}/3
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

export default Terminal;