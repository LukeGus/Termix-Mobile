import {
  View,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAppContext } from "../AppContext";
import { useState, useEffect, useRef } from "react";
import { setCookie, getCurrentServerUrl } from "../main-axios";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, RefreshCw } from "lucide-react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
import { WebViewSource } from "react-native-webview/lib/WebViewTypes";

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
    setWebViewKey(String(Date.now()));
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

  const onMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "AUTH_SUCCESS" && data.token) {
        await setCookie("jwt", data.token);
        setAuthenticated(true);
        setShowLoginForm(false);
      }
    } catch (error) {
      console.error("[LoginForm] Error processing auth token:", error);
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

      const checkAuth = () => {
        try {
          const localToken = localStorage.getItem('jwt');
          if (localToken && !hasNotified) {
            hasNotified = true;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'AUTH_SUCCESS',
              token: localToken
            }));
            clearInterval(intervalId);
            return;
          }

          const sessionToken = sessionStorage.getItem('jwt');
          if (sessionToken && !hasNotified) {
            hasNotified = true;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'AUTH_SUCCESS',
              token: sessionToken
            }));
            clearInterval(intervalId);
            return;
          }

          const cookies = document.cookie;
          if (cookies && cookies.length > 0) {
            const cookieArray = cookies.split('; ');
            const tokenCookie = cookieArray.find(row => row.startsWith('jwt='));

            if (tokenCookie && !hasNotified) {
              const token = tokenCookie.split('=')[1];
              if (token && token.length > 0) {
                hasNotified = true;
                try {
                  localStorage.setItem('jwt', token);
                } catch (e) {}
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'AUTH_SUCCESS',
                  token: token
                }));
                clearInterval(intervalId);
                return;
              }
            }
          }
        } catch (error) {
          console.error('[WebView] Error in checkAuth:', error);
        }
      };

      const intervalId = setInterval(checkAuth, 500);

      checkAuth();

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
        injectedJavaScript={injectedJavaScript}
        incognito={true}
        cacheEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        sharedCookiesEnabled={false}
        thirdPartyCookiesEnabled={false}
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
