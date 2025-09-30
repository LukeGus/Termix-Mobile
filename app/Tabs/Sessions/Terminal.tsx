import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { View, Text, ActivityIndicator, Dimensions } from "react-native";
import { WebView } from "react-native-webview";
import { getCurrentServerUrl, getCookie } from "../../main-axios";
import { showToast } from "../../utils/toast";

interface TerminalProps {
  hostConfig: {
    id: number;
    name: string;
    ip: string;
    port: number;
    username: string;
    authType: "password" | "key" | "credential";
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

export type TerminalHandle = {
  sendInput: (data: string) => void;
  fit: () => void;
};

export const Terminal = forwardRef<TerminalHandle, TerminalProps>(
  ({ hostConfig, isVisible, title = "Terminal", onClose }, ref) => {
    const webViewRef = useRef<WebView>(null);
    const [webViewKey, setWebViewKey] = useState(0);
    const [screenDimensions, setScreenDimensions] = useState(
      Dimensions.get("window"),
    );
    const [isConnecting, setIsConnecting] = useState(true);
    const [isRetrying, setIsRetrying] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [htmlContent, setHtmlContent] = useState("");
    const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

    useEffect(() => {
      const subscription = Dimensions.addEventListener(
        "change",
        ({ window }) => {
          setScreenDimensions(window);
        },
      );

      return () => subscription?.remove();
    }, []);

    const handleConnectionFailure = useCallback(
      (errorMessage: string) => {
        showToast.error(errorMessage);
        setIsConnecting(false);
        setIsConnected(false);
        if (onClose) {
          onClose();
        }
      },
      [onClose],
    );

    const getWebSocketUrl = async () => {
      const serverUrl = getCurrentServerUrl();

      if (!serverUrl) {
        showToast.error(
          "No server URL found - please configure a server first",
        );
        return null;
      }

      const jwtToken = await getCookie("jwt");
      if (!jwtToken || jwtToken.trim() === "") {
        showToast.error("Authentication required - please log in again");
        return null;
      }

      const wsProtocol = serverUrl.startsWith("https://") ? "wss://" : "ws://";
      const wsHost = serverUrl.replace(/^https?:\/\//, "");
      const cleanHost = wsHost.replace(/\/$/, "");
      const wsUrl = `${wsProtocol}${cleanHost}/ssh/websocket/?token=${encodeURIComponent(jwtToken)}`;

      return wsUrl;
    };

    const generateHTML = useCallback(async () => {
      const wsUrl = await getWebSocketUrl();
      const { width, height } = screenDimensions;

      if (!wsUrl) {
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Terminal</title>
</head>
<body style="background-color: #09090b; color: #f7f7f7; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
  <div style="text-align: center;">
    <h2>No Server Configured</h2>
    <p>Please configure a server first</p>
  </div>
</body>
</html>`;
      }

      const terminalWidth = Math.floor(width / 8);
      const terminalHeight = Math.floor(height / 16);

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
      padding: 4px 4px 20px 4px;
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
    /* Disable text selection and callouts to avoid native dialogues */
    * { -webkit-tap-highlight-color: transparent; }
    html, body, #terminal, .xterm * {
      user-select: none;
      -webkit-user-select: none;
      -ms-user-select: none;
    }
  </style>
</head>
<body>
  <div id="terminal"></div>
  
  <script>
    const screenWidth = ${width};
    const screenHeight = ${height};
    
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

    const fitAddon = new FitAddon.FitAddon();
    terminal.loadAddon(fitAddon);
    
    terminal.open(document.getElementById('terminal'));
    
    fitAddon.fit();
    
    const hostConfig = ${JSON.stringify(hostConfig)};
    const wsUrl = '${wsUrl}';
    
    let ws = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;
    let reconnectTimeout = null;
    let connectionTimeout = null;
    let shouldNotReconnect = false;
    let hasNotifiedFailure = false;
    
    function notifyConnectionState(state, data = {}) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: state,
          data: data
        }));
      }
    }

    function notifyFailureOnce(message) {
      if (hasNotifiedFailure) return;
      hasNotifiedFailure = true;
      notifyConnectionState('connectionFailed', { hostName: hostConfig.name, message });
    }

    function isUnrecoverableError(message) {
      if (!message) return false;
      const m = String(message).toLowerCase();
      return m.includes('password') || m.includes('authentication') || m.includes('permission denied') || m.includes('invalid') || m.includes('incorrect') || m.includes('denied');
    }

    function scheduleReconnect() {
      if (shouldNotReconnect) return;
      if (reconnectAttempts >= maxReconnectAttempts) {
        notifyFailureOnce('Maximum reconnection attempts reached');
        return;
      }
      reconnectAttempts += 1;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 5000);
      notifyConnectionState('connecting', { retryCount: reconnectAttempts });
      reconnectTimeout = setTimeout(() => {
        connectWebSocket();
      }, delay);
    }
    
    window.nativeInput = function(data) {
      try {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'input', data: data }));
        } else {
          terminal.write(data);
        }
      } catch (e) {}
    }

    const terminalElement = document.getElementById('terminal');
    ['touchstart','touchend','touchmove','mousedown','mouseup','click','dblclick','contextmenu'].forEach(function(ev){
      terminalElement.addEventListener(ev, function(e){
        e.preventDefault();
        e.stopPropagation();
        return false;
      }, { passive: false });
    });

    function connectWebSocket() {
      try {
        if (!wsUrl) {
          notifyFailureOnce('No WebSocket URL available - server not configured');
          return;
        }
        
        notifyConnectionState('connecting', { retryCount: reconnectAttempts });
        
        ws = new WebSocket(wsUrl);
        
        connectionTimeout = setTimeout(() => {
          if (ws && ws.readyState === WebSocket.CONNECTING) {
            try { ws.close(); } catch (_) {}
            if (!shouldNotReconnect) {
              scheduleReconnect();
            } else {
              notifyFailureOnce('Connection timeout - server not responding');
            }
          }
        }, 30000);
        
        ws.onopen = function() {
          clearTimeout(connectionTimeout);
          notifyConnectionState('connected', { hostName: hostConfig.name });
          hasNotifiedFailure = false;
          reconnectAttempts = 0;
          
          terminal.clear();
          terminal.reset();
          terminal.write('\x1b[2J\x1b[H');
          
          const connectMessage = {
            type: 'connectToHost',
            data: {
              cols: terminal.cols,
              rows: terminal.rows,
              hostConfig: hostConfig
            }
          };
          
          ws.send(JSON.stringify(connectMessage));
          
          terminal.onData(function(data) {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'input', data: data }));
            }
          });
          
          startPingInterval();
        };
        
        ws.onmessage = function(event) {
          try {
            const msg = JSON.parse(event.data);
            
            if (msg.type === 'data') {
              terminal.write(msg.data);
            } else if (msg.type === 'error') {
              const message = msg.message || 'Unknown error';
              if (isUnrecoverableError(message)) {
                shouldNotReconnect = true;
                notifyFailureOnce('Authentication failed: ' + message);
                try { ws && ws.close(1000); } catch (_) {}
                return;
              }
            } else if (msg.type === 'connected') {
            } else if (msg.type === 'disconnected') {
              notifyConnectionState('disconnected', { hostName: hostConfig.name });
            } else if (msg.type === 'pong') {
            }
          } catch (error) {
            terminal.write(event.data);
          }
        };
        
        ws.onclose = function(event) {
          clearTimeout(connectionTimeout);
          stopPingInterval();
          
          if (shouldNotReconnect) {
            notifyFailureOnce('Connection closed');
            return;
          }
          if (event.code === 1000 || event.code === 1001) {
            notifyFailureOnce('Connection closed');
            return;
          }
          scheduleReconnect();
        };
        
        ws.onerror = function(error) {
          clearTimeout(connectionTimeout);
        };
        
      } catch (error) {
        clearTimeout(connectionTimeout);
        notifyFailureOnce('Failed to create WebSocket connection: ' + error.message);
      }
    }
    
    let pingInterval = null;
    
    function startPingInterval() {
      stopPingInterval();
      pingInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 15000);
    }
    
    function stopPingInterval() {
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
    }
    
    function handleResize() {
      fitAddon.fit();
      
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'resize',
          data: { cols: terminal.cols, rows: terminal.rows }
        }));
      }
    }

    window.nativeFit = function() {
      try {
        fitAddon.fit();
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'resize', data: { cols: terminal.cols, rows: terminal.rows } }));
        }
      } catch (e) {}
    }
    
    window.addEventListener('resize', handleResize);
    
    window.addEventListener('orientationchange', function() {
      setTimeout(handleResize, 100);
    });
    
    terminal.clear();
    terminal.reset();
    terminal.write('\x1b[2J\x1b[H');
    
    connectWebSocket();
    
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
  </script>
</body>
</html>
    `;
    }, [hostConfig, screenDimensions]);

    useEffect(() => {
      const updateHtml = async () => {
        const html = await generateHTML();
        setHtmlContent(html);
      };
      updateHtml();
    }, [generateHTML]);

    const handleWebViewMessage = useCallback(
      (event: any) => {
        try {
          const message = JSON.parse(event.nativeEvent.data);

          switch (message.type) {
            case "connecting":
              if (message.data.retryCount > 0) {
                setIsRetrying(true);
                setIsConnecting(false);
              } else {
                setIsConnecting(true);
                setIsRetrying(false);
              }
              setRetryCount(message.data.retryCount);
              break;

            case "connected":
              setIsConnecting(false);
              setIsRetrying(false);
              setIsConnected(true);
              setRetryCount(0);
              setTimeout(() => {}, 100);
              break;

            case "disconnected":
              setIsConnecting(false);
              setIsRetrying(false);
              setIsConnected(false);
              showToast.warning(`Disconnected from ${message.data.hostName}`);
              if (onClose) {
                onClose();
              }
              break;

            case "connectionFailed":
              setIsConnecting(false);
              setIsRetrying(false);
              handleConnectionFailure(
                `${message.data.hostName}: ${message.data.message}`,
              );
              break;
          }
        } catch (error) {}
      },
      [handleConnectionFailure, onClose],
    );

    useImperativeHandle(
      ref,
      () => ({
        sendInput: (data: string) => {
          try {
            const escaped = JSON.stringify(data);
            webViewRef.current?.injectJavaScript(
              `window.nativeInput(${escaped}); true;`,
            );
          } catch (e) {}
        },
        fit: () => {
          try {
            webViewRef.current?.injectJavaScript(
              `window.nativeFit && window.nativeFit(); true;`,
            );
          } catch (e) {}
        },
      }),
      [],
    );

    useEffect(() => {
      setWebViewKey((prev) => prev + 1);
      setIsConnecting(true);
      setIsRetrying(false);
      setIsConnected(false);
      setRetryCount(0);

      const updateHtml = async () => {
        const html = await generateHTML();
        setHtmlContent(html);
      };
      updateHtml();
    }, [hostConfig.id, generateHTML]);

    useEffect(() => {
      return () => {
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
      };
    }, []);

    return (
      <View
        style={{
          flex: 1,
          width: "100%",
          height: "100%",
          opacity: isVisible ? 1 : 0,
          position: isVisible ? "relative" : "absolute",
          zIndex: isVisible ? 1 : -1,
        }}
      >
        <WebView
          key={`terminal-${hostConfig.id}-${webViewKey}`}
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={{
            flex: 1,
            width: "100%",
            height: "100%",
            backgroundColor: "#09090b",
            opacity: isRetrying || isConnecting ? 0 : 1,
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          scalesPageToFit={false}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          keyboardDisplayRequiresUserAction={false}
          onScroll={() => {}}
          onMessage={handleWebViewMessage}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            handleConnectionFailure(
              `WebView error: ${nativeEvent.description}`,
            );
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            handleConnectionFailure(
              `WebView HTTP error: ${nativeEvent.statusCode}`,
            );
          }}
          scrollEnabled={false}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={false}
        />

        {((isConnecting && !isConnected) || isRetrying) && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#09090b",
              padding: 20,
            }}
          >
            <View
              style={{
                backgroundColor: "#1a1a1a",
                borderRadius: 12,
                padding: 24,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#303032",
                minWidth: 280,
              }}
            >
              <ActivityIndicator size="large" color="#22C55E" />
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 18,
                  fontWeight: "600",
                  marginTop: 16,
                  textAlign: "center",
                }}
              >
                {isRetrying ? "Reconnecting..." : "Connecting..."}
              </Text>
              <Text
                style={{
                  color: "#9CA3AF",
                  fontSize: 14,
                  marginTop: 8,
                  textAlign: "center",
                }}
              >
                {hostConfig.name} • {hostConfig.ip}
              </Text>
              {retryCount > 0 && (
                <View
                  style={{
                    backgroundColor: "#0f0f0f",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    marginTop: 12,
                    borderWidth: 1,
                    borderColor: "#303032",
                  }}
                >
                  <Text
                    style={{
                      color: "#EF4444",
                      fontSize: 12,
                      fontWeight: "500",
                      textAlign: "center",
                    }}
                  >
                    Retry {retryCount}/3
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    );
  },
);

export default Terminal;
