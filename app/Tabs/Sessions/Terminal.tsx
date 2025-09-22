import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import { WebView } from 'react-native-webview';
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const previousHostConfigRef = useRef(hostConfig);
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getWebSocketUrl = () => {
    const serverUrl = getCurrentServerUrl();
    
    // Show immediate debug info
    showToast.info(`Server URL: ${serverUrl || 'NULL'}`);
    
    if (!serverUrl) {
      showToast.error('No server URL found - please configure a server first');
      return null;
    }

    const wsProtocol = serverUrl.startsWith('https://') ? 'wss://' : 'ws://';
    const wsHost = serverUrl.replace(/^https?:\/\//, '');
    const cleanHost = wsHost.replace(/\/$/, '');
    const wsUrl = `${wsProtocol}${cleanHost}/ssh/websocket/`;
    
    showToast.info(`WebSocket URL: ${wsUrl}`);
    return wsUrl;
  };

  // Initialize terminal when component mounts
  useEffect(() => {
    // Terminal initialization logic can go here if needed
  }, [hostConfig.name]);

  const generateHTML = useCallback(() => {
    const wsUrl = getWebSocketUrl();
    
    if (!wsUrl) {
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Terminal</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #09090b;
      font-family: 'JetBrains Mono', 'MesloLGS NF', 'FiraCode Nerd Font', 'Cascadia Code', 'JetBrains Mono', Consolas, 'Courier New', monospace;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      color: #ffffff;
    }
    .error-message {
      text-align: center;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div class="error-message">
    <div>No server configured</div>
    <div style="font-size: 14px; margin-top: 10px; color: #888;">Please configure a server first</div>
  </div>
</body>
</html>
      `;
    }
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
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
      box-sizing: border-box;
    }
    
    #terminal {
      width: 100%;
      height: 100%;
      min-height: 100vh;
      box-sizing: border-box;
    }
    
    .xterm {
      width: 100% !important;
      height: 100% !important;
      font-feature-settings: "liga" 1, "calt" 1;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    .xterm-viewport {
      width: 100% !important;
      height: 100% !important;
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
    
    input, textarea, select {
      -webkit-appearance: none;
      -webkit-user-select: text;
      -webkit-touch-callout: none;
      -webkit-tap-highlight-color: transparent;
    }
      
    html, body {
      height: 100% !important;
      overflow: hidden;
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

    // Load fit addon
    const { FitAddon } = xtermAddonFit;
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    // Open terminal
    terminal.open(document.getElementById('terminal'));
    
    // Fit terminal to container with multiple attempts
    setTimeout(() => {
      fitAddon.fit();
      setTimeout(() => {
        fitAddon.fit();
      }, 100);
    }, 50);
    
    // Host configuration from React Native
    const hostConfig = ${JSON.stringify(hostConfig)};
    const wsUrl = '${wsUrl}';
    
    let ws = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;
    let reconnectTimeout = null;
    let inputHandler = null;
    let isConnected = false;
    
    // WebSocket connection function
    function connectWebSocket() {
      try {
        // Check if WebSocket URL is available
        if (!wsUrl) {
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'error',
            data: { hostName: hostConfig.name, message: 'No server configured' }
          }));
          return;
        }
        
        // Clean up existing connection
        if (ws) {
          ws.close();
        }
        
        // Remove existing input handler to prevent duplication
        if (inputHandler) {
          terminal.offData(inputHandler);
          inputHandler = null;
        }
        
        // Notify React Native that we're connecting
        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'connecting',
          data: { hostName: hostConfig.name, retryCount: reconnectAttempts }
        }));
        
        ws = new WebSocket(wsUrl);
        
        ws.onopen = function() {
          // Notify React Native that WebSocket opened
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'debug',
            data: { message: 'WebSocket opened successfully' }
          }));
          
          reconnectAttempts = 0;
          isConnected = false; // Will be set to true when we get 'connected' message
          
          // Clear terminal on reconnect
          terminal.clear();
          
          // Send initial connection message
          const connectMessage = {
            type: 'connectToHost',
            data: {
              cols: terminal.cols,
              rows: terminal.rows,
              hostConfig: hostConfig
            }
          };
          
          // Notify React Native about sending message
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'debug',
            data: { message: 'Sending connectToHost message: ' + JSON.stringify(connectMessage) }
          }));
          
          ws.send(JSON.stringify(connectMessage));
          
          // Set up terminal input handler (only once)
          inputHandler = function(data) {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'input', data: data }));
            }
          };
          terminal.onData(inputHandler);
          
          // Start ping interval
          startPingInterval();
          
          // Set up connection timeout - if server doesn't respond within 10 seconds, show error
          const connectionTimeout = setTimeout(() => {
            if (!isConnected) {
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'error',
                data: { hostName: hostConfig.name, message: 'Connection timeout - server did not respond' }
              }));
            }
          }, 10000);
          
          // Store timeout reference for cleanup
          window.connectionTimeout = connectionTimeout;
          
          // Fit terminal after connection with multiple attempts
          setTimeout(() => {
            fitAddon.fit();
            setTimeout(() => {
              fitAddon.fit();
            }, 100);
          }, 50);
        };
        
        ws.onmessage = function(event) {
          try {
            const msg = JSON.parse(event.data);
            
            // Notify React Native about received message
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'debug',
              data: { message: 'Received message: ' + JSON.stringify(msg) }
            }));
            
            if (msg.type === 'data') {
              terminal.write(msg.data);
            } else if (msg.type === 'error') {
              // Notify React Native of error
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'error',
                data: { hostName: hostConfig.name, message: msg.message }
              }));
            } else if (msg.type === 'connected') {
              isConnected = true;
              // Clear connection timeout
              if (window.connectionTimeout) {
                clearTimeout(window.connectionTimeout);
                window.connectionTimeout = null;
              }
              // Notify React Native of successful connection
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'connected',
                data: { hostName: hostConfig.name }
              }));
            } else if (msg.type === 'disconnected') {
              isConnected = false;
              // Notify React Native of disconnection
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'disconnected',
                data: { hostName: hostConfig.name, message: msg.message }
              }));
            }
          } catch (error) {
            // Notify React Native of parsing error
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'error',
              data: { hostName: hostConfig.name, message: 'Error parsing message' }
            }));
          }
        };
        
        ws.onclose = function(event) {
          // Notify React Native about WebSocket close
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'debug',
            data: { message: 'WebSocket closed. Code: ' + event.code + ', Reason: ' + event.reason }
          }));
          
          isConnected = false;
          stopPingInterval();
          
          // Notify React Native of disconnection
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'disconnected',
            data: { hostName: hostConfig.name, message: 'WebSocket connection lost' }
          }));
          
          // Attempt to reconnect
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
            
            // Notify React Native of retry attempt
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'retrying',
              data: { 
                hostName: hostConfig.name, 
                retryCount: reconnectAttempts, 
                maxRetries: maxReconnectAttempts,
                delay: delay
              }
            }));
            
            reconnectTimeout = setTimeout(() => {
              connectWebSocket();
            }, delay);
          } else {
            // Notify React Native of max retries reached
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'maxRetriesReached',
              data: { hostName: hostConfig.name, maxRetries: maxReconnectAttempts }
            }));
          }
        };
        
        ws.onerror = function(error) {
          // Notify React Native about WebSocket error
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'debug',
            data: { message: 'WebSocket error: ' + JSON.stringify(error) }
          }));
          
          isConnected = false;
          // Notify React Native of WebSocket error
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'error',
            data: { hostName: hostConfig.name, message: 'WebSocket connection failed - check if server is running and URL is correct' }
          }));
        };
        
      } catch (error) {
        // Notify React Native of connection creation error
        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'error',
          data: { hostName: hostConfig.name, message: 'Failed to create WebSocket connection' }
        }));
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
      // Force a small delay to ensure container is properly sized
      setTimeout(() => {
        // Fit terminal to container first
        fitAddon.fit();
        
        // Force another fit after a brief delay
        setTimeout(() => {
          fitAddon.fit();
        }, 50);
        
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'resize',
            data: { cols: terminal.cols, rows: terminal.rows }
          }));
        }
      }, 10);
    }
    
    // Listen for resize events
    window.addEventListener('resize', handleResize);
    
    // Also fit on orientation change
    window.addEventListener('orientationchange', function() {
      setTimeout(handleResize, 100);
    });
    
    // Initial connection
    connectWebSocket();
    
    // Cleanup function
    window.addEventListener('beforeunload', function() {
      stopPingInterval();
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (inputHandler) {
        terminal.offData(inputHandler);
        inputHandler = null;
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
  }, [hostConfig]);

  // Handle messages from WebView
  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'connecting':
          setIsConnecting(true);
          setRetryCount(message.data.retryCount);
          // Don't show toast for connecting - just show the connecting screen
          
          // Clear any existing timeout
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          break;
          
        case 'connected':
          setIsConnecting(false);
          setRetryCount(0);
          // Clear connection timeout
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          showToast.success(`Connected to ${message.data.hostName}`);
          break;
          
        case 'disconnected':
          setIsConnecting(true);
          showToast.warning(`Disconnected from ${message.data.hostName}`);
          // Close the tab after a short delay
          setTimeout(() => {
            if (onClose) {
              onClose();
            }
          }, 2000);
          break;
          
        case 'retrying':
          setIsConnecting(true);
          setRetryCount(message.data.retryCount);
          showToast.warning(`Retrying connection to ${message.data.hostName} (${message.data.retryCount}/${message.data.maxRetries})`);
          break;
          
        case 'maxRetriesReached':
          setIsConnecting(false);
          showToast.error(`Failed to connect to ${message.data.hostName} after ${message.data.maxRetries} attempts`);
          // Close the tab after a short delay
          setTimeout(() => {
            if (onClose) {
              onClose();
            }
          }, 3000);
          break;
          
        case 'debug':
          showToast.info(`Debug: ${message.data.message}`);
          break;
          
        case 'error':
          setIsConnecting(false);
          showToast.error(`${message.data.hostName}: ${message.data.message}`);
          // Show alert for connection errors
          if (message.data.message.includes('timeout') || message.data.message.includes('failed')) {
            showToast.error(`Connection failed: ${message.data.message}`);
          }
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  }, []);

  // Only refresh WebView when hostConfig actually changes (not when switching tabs)
  useEffect(() => {
    const currentConfig = hostConfig;
    const previousConfig = previousHostConfigRef.current;
    
    // Check if host configuration has actually changed
    const hasConfigChanged = 
      currentConfig.id !== previousConfig.id ||
      currentConfig.name !== previousConfig.name ||
      currentConfig.ip !== previousConfig.ip ||
      currentConfig.port !== previousConfig.port ||
      currentConfig.username !== previousConfig.username ||
      currentConfig.authType !== previousConfig.authType;
    
    if (hasConfigChanged && isInitialized) {
      setWebViewKey(prev => prev + 1);
      previousHostConfigRef.current = currentConfig;
    } else if (!isInitialized) {
      // First time initialization
      setIsInitialized(true);
      previousHostConfigRef.current = currentConfig;
    }
  }, [hostConfig, isInitialized]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, []);

  // Handle visibility changes
  useEffect(() => {
    // Visibility change logic can go here if needed
  }, [isVisible, isConnecting]);

  if (!isVisible) {
    return null;
  }

  return (
    <View style={{ 
      flex: 1,
      width: '100%',
      height: '100%',
    }}>
      {isConnecting ? (
        <View style={{
          flex: 1,
          width: '100%',
          height: '100%',
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
      ) : (
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
            showToast.error(`WebView error: ${nativeEvent.description}`);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            showToast.error(`WebView HTTP error: ${nativeEvent.statusCode}`);
          }}
          scrollEnabled={false}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={false}
        />
      )}
    </View>
  );
};

export default Terminal;
