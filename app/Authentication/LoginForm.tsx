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
      console.log("[LoginForm] Received message from WebView:", data.type);

      if (data.type === "AUTH_SUCCESS" && data.token) {
        console.log("[LoginForm] JWT token received, length:", data.token.length);
        await setCookie("jwt", data.token);
        console.log("[LoginForm] JWT token stored successfully with key 'jwt'");
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
      let hasNotified = false;

      const checkAuth = () => {
        try {
          // Check for token in multiple places
          const cookies = document.cookie;
          console.log('[WebView] Checking cookies, length:', cookies.length);

          if (!cookies) {
            return;
          }

          const cookieArray = cookies.split('; ');
          const tokenCookie = cookieArray.find(row => row.startsWith('jwt='));

          if (tokenCookie && !hasNotified) {
            const token = tokenCookie.split('=')[1];
            if (token && token.length > 0) {
              console.log('[WebView] JWT token found, length:', token.length);
              hasNotified = true;
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'AUTH_SUCCESS',
                token: token
              }));
              clearInterval(intervalId);
            }
          }

          // Also check localStorage as backup
          const localToken = localStorage.getItem('jwt');
          if (localToken && !hasNotified) {
            console.log('[WebView] JWT token found in localStorage');
            hasNotified = true;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'AUTH_SUCCESS',
              token: localToken
            }));
            clearInterval(intervalId);
          }
        } catch (error) {
          console.error('[WebView] Error in checkAuth:', error);
        }
      };

      const intervalId = setInterval(checkAuth, 500);

      // Also check immediately
      checkAuth();

      // Stop checking after 2 minutes to prevent infinite loops
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
        incognito={false}
        cacheEnabled={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
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
