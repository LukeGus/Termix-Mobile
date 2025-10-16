import {
  View,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useAppContext } from "../AppContext";
import { useState, useEffect, useRef } from "react";
import { setCookie, getCurrentServerUrl } from "../main-axios";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, RefreshCw } from "lucide-react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
import { WebViewSource } from "react-native-webview/lib/WebViewTypes";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginForm() {
  const {
    setAuthenticated,
    setShowLoginForm,
    setShowServerManager,
    selectedServer,
  } = useAppContext();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const [url, setUrl] = useState("");
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<WebViewSource>({ uri: "" });
  const [webViewKey, setWebViewKey] = useState(() => String(Date.now()));

  useEffect(() => {
    const clearPersistedData = async () => {
      try {
        await AsyncStorage.removeItem("jwt");

        setWebViewKey(String(Date.now()));
      } catch (error) {
        console.error("[LoginForm] Error clearing persisted data:", error);
      }
    };

    clearPersistedData();
  }, []);

  useEffect(() => {
    const serverUrl = getCurrentServerUrl();
    if (serverUrl) {
      setSource({ uri: serverUrl });
      setUrl(serverUrl);
    } else if (selectedServer?.ip) {
      setSource({ uri: selectedServer.ip });
      setUrl(selectedServer.ip);
    }
  }, [selectedServer]);

  const handleBackToServerConfig = () => {
    setShowLoginForm(false);
    setShowServerManager(true);
  };

  const handleRefresh = () => {
    webViewRef.current?.reload();
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    setLoading(navState.loading);
    if (!navState.loading) {
      setUrl(navState.url);
    }
  };

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const onMessage = async (event: any) => {
    if (isAuthenticating) {
      return;
    }

    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === "AUTH_SUCCESS" && data.token) {
        setIsAuthenticating(true);

        await setCookie("jwt", data.token);

        const savedToken = await AsyncStorage.getItem("jwt");
        if (!savedToken) {
          console.error("[LoginForm] Failed to verify saved token!");
          setIsAuthenticating(false);
          Alert.alert("Error", "Failed to save authentication token. Please try again.");
          return;
        }
        console.log("[LoginForm] Token verified - readable from AsyncStorage");

        await new Promise(resolve => setTimeout(resolve, 200));

        setAuthenticated(true);
        setShowLoginForm(false);
      }
    } catch (error) {
      console.error("[LoginForm] Error processing auth token:", error);
      setIsAuthenticating(false);
      Alert.alert("Error", "Failed to process authentication token.");
    }
  };

  const injectedJavaScript = `
    (function() {
      const style = document.createElement('style');
      style.textContent = \`
        /* Hide Install Mobile App button */
        button:has-text("Install Mobile App"),
        [class*="mobile-app"],
        [class*="install-app"],
        [id*="mobile-app"],
        [id*="install-app"],
        a[href*="app-store"],
        a[href*="play-store"],
        a[href*="google.com/store"],
        a[href*="apple.com/app"],
        button[aria-label*="Install"],
        button[aria-label*="Mobile App"],
        button[aria-label*="Download App"],
        a[aria-label*="Install"],
        a[aria-label*="Mobile App"],
        a[aria-label*="Download App"] {
          display: none !important;
        }
      \`;
      document.head.appendChild(style);

      const hideByText = () => {
        const buttons = document.querySelectorAll('button, a');
        buttons.forEach(btn => {
          const text = btn.textContent?.toLowerCase() || '';
          if (text.includes('install') && text.includes('mobile')) {
            btn.style.display = 'none';
          }
          if (text.includes('download') && text.includes('app')) {
            btn.style.display = 'none';
          }
          if (text.includes('get') && text.includes('app')) {
            btn.style.display = 'none';
          }
        });
      };

      hideByText();
      setTimeout(hideByText, 500);
      setTimeout(hideByText, 1000);
      setTimeout(hideByText, 2000);

      const observer = new MutationObserver(hideByText);
      observer.observe(document.body, { childList: true, subtree: true });

      let hasNotified = false;
      let lastCheckedToken = null;

      const notifyAuth = (token, source) => {
        if (hasNotified || !token || token === lastCheckedToken) {
          console.log('[WebView] Skipping notification - already notified or invalid token');
          return;
        }

        console.log('[WebView] Preparing to notify React Native of successful auth from:', source);
        hasNotified = true;
        lastCheckedToken = token;

        try {
          localStorage.setItem('jwt', token);
          console.log('[WebView] Saved token to localStorage');
        } catch (e) {
          console.error('[WebView] Failed to save to localStorage:', e);
        }

        try {
          const message = JSON.stringify({
            type: 'AUTH_SUCCESS',
            token: token,
            source: source,
            timestamp: Date.now()
          });

          console.log('[WebView] Sending message to React Native:', message.substring(0, 100) + '...');

          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(message);
            console.log('[WebView] Message sent successfully');
          } else {
            console.error('[WebView] ReactNativeWebView.postMessage not available!');
          }
        } catch (e) {
          console.error('[WebView] Error sending message:', e);
        }
      };

      const checkAuth = () => {
        try {
          const localToken = localStorage.getItem('jwt');
          if (localToken && localToken.length > 20) {
            console.log('[WebView] Found JWT in localStorage');
            notifyAuth(localToken, 'localStorage');
            return true;
          }

          const sessionToken = sessionStorage.getItem('jwt');
          if (sessionToken && sessionToken.length > 20) {
            console.log('[WebView] Found JWT in sessionStorage');
            notifyAuth(sessionToken, 'sessionStorage');
            return true;
          }

          const cookies = document.cookie;
          if (cookies && cookies.length > 0) {
            const cookieArray = cookies.split('; ');
            const tokenCookie = cookieArray.find(row => row.startsWith('jwt='));

            if (tokenCookie) {
              const token = tokenCookie.split('=')[1];
              if (token && token.length > 20) {
                console.log('[WebView] Found JWT in cookies');
                notifyAuth(token, 'cookie');
                return true;
              }
            }
          }
        } catch (error) {
          console.error('[WebView] Error in checkAuth:', error);
        }
        return false;
      };

      console.log('[WebView] Authentication monitoring initialized');

      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        originalSetItem.apply(this, arguments);
        if (key === 'jwt' && value && value.length > 20 && !hasNotified) {
          checkAuth();
        }
      };

      const originalSessionSetItem = sessionStorage.setItem;
      sessionStorage.setItem = function(key, value) {
        originalSessionSetItem.apply(this, arguments);
        if (key === 'jwt' && value && value.length > 20 && !hasNotified) {
          checkAuth();
        }
      };

      const intervalId = setInterval(() => {
        if (hasNotified) {
          clearInterval(intervalId);
          return;
        }
        if (checkAuth()) {
          clearInterval(intervalId);
        }
      }, 300);

      checkAuth();

      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && !hasNotified) {
          checkAuth();
        }
      });

      setTimeout(() => {
        clearInterval(intervalId);
      }, 120000);
    })();
  `;

  if (!source.uri) {
    return (
      <View className="flex-1 justify-center items-center bg-dark-bg">
        <ActivityIndicator size="large" color="#ffffff" />
        <Text className="text-white mt-4">Loading server configuration...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between p-4 bg-dark-bg">
        <TouchableOpacity
          onPress={handleBackToServerConfig}
          className="flex-row items-center"
        >
          <ArrowLeft size={20} color="#ffffff" />
          <Text className="text-white text-lg ml-2">Server</Text>
        </TouchableOpacity>
        <View className="flex-1 mx-4">
          <Text className="text-gray-400 text-center" numberOfLines={1}>
            {url.replace(/^https?:\/\//, "")}
          </Text>
        </View>
        <TouchableOpacity onPress={handleRefresh}>
          <RefreshCw size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <WebView
        key={webViewKey}
        ref={webViewRef}
        source={source}
        style={{ flex: 1, backgroundColor: "#18181b" }}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={onMessage}
        onConsoleMessage={(event) => {
          console.log('[WebView Console]', event.nativeEvent.message);
        }}
        injectedJavaScript={injectedJavaScript}
        injectedJavaScriptBeforeContentLoaded={`
          console.log('[WebView] Running before content loaded script...');
          if (typeof document !== 'undefined') {
            try {
              const cookies = document.cookie.split(";");
              console.log('[WebView] Found', cookies.length, 'cookies to clear');
              cookies.forEach(function(c) {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
              });
              console.log('[WebView] Cookies cleared successfully');
            } catch(e) {
              console.error('[WebView] Error clearing cookies:', e);
            }
          }
          console.log('[WebView] Before content loaded script completed');
        `}
        incognito={true}
        cacheEnabled={false}
        cacheMode="LOAD_NO_CACHE"
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        sharedCookiesEnabled={false}
        thirdPartyCookiesEnabled={false}
        {...(Platform.OS === 'android' && {
          mixedContentMode: 'always',
          allowFileAccess: false,
        })}
        renderLoading={() => (
          <View
            style={{
              backgroundColor: "#18181b",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        )}
      />
    </View>
  );
}
