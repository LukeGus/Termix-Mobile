import {
  TextInput,
  View,
  TouchableOpacity,
  Text,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAppContext } from "../AppContext";
import { useState, useEffect } from "react";
import {
  saveServerConfig,
  testServerConnection,
  getCurrentServerUrl,
} from "../main-axios";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Server, Wifi, CheckCircle, AlertCircle } from "lucide-react-native";

type ServerDetails = {
  ip: string;
};

export default function ServerForm() {
  const {
    setShowServerManager,
    setShowLoginForm,
    setSelectedServer,
    selectedServer,
  } = useAppContext();
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState<ServerDetails>({
    ip: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadExistingConfig = async () => {
      try {
        const currentUrl = getCurrentServerUrl();
        if (currentUrl) {
          setFormData({ ip: currentUrl });
        } else if (selectedServer?.ip) {
          setFormData({ ip: selectedServer.ip });
        }
      } catch (error) {}
    };

    loadExistingConfig();
  }, [selectedServer]);

  const handleInputChange = (field: keyof ServerDetails, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const normalizeServerUrl = (input: string): string => {
    let url = input.trim();

    // Remove trailing slash
    url = url.replace(/\/$/, "");

    // If no protocol is specified, try to be smart about it
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      // For localhost or IP addresses, prefer HTTP
      if (url.includes("localhost") || url.includes("127.0.0.1") || /^\d+\.\d+\.\d+\.\d+/.test(url)) {
        url = `http://${url}`;
      } else {
        // For domain names, prefer HTTPS
        url = `https://${url}`;
      }
    }

    return url;
  };

  const testConnection = async () => {
    if (!formData.ip.trim()) {
      setConnectionStatus("error");
      setErrorMessage("Please enter a server address");
      return;
    }

    setConnectionStatus("testing");
    setErrorMessage("");

    try {
      let serverUrl = normalizeServerUrl(formData.ip);
      let connectionTest = await testServerConnection(serverUrl);

      // If the initial test fails and we defaulted to HTTPS, try HTTP as fallback
      if (!connectionTest.success && serverUrl.startsWith("https://")) {
        const httpUrl = serverUrl.replace("https://", "http://");
        const httpTest = await testServerConnection(httpUrl);
        
        if (httpTest.success) {
          // Update the form data to use the working HTTP URL
          setFormData(prev => ({ ...prev, ip: httpUrl }));
          serverUrl = httpUrl;
          connectionTest = httpTest;
        }
      }

      if (connectionTest.success) {
        setConnectionStatus("success");
        setErrorMessage("");
      } else {
        setConnectionStatus("error");
        setErrorMessage(connectionTest.error || "Connection failed");
      }
    } catch (error: any) {
      setConnectionStatus("error");
      setErrorMessage(error?.message || "Connection test failed");
    }
  };

  const onServerDetailsSubmit = async () => {
    if (!formData.ip.trim()) {
      Alert.alert("Error", "Please enter a server address");
      return;
    }

    if (connectionStatus !== "success") {
      Alert.alert(
        "Connection Required",
        "Please test the connection first before proceeding.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const serverUrl = normalizeServerUrl(formData.ip);

      const serverConfig = {
        serverUrl,
        lastUpdated: new Date().toISOString(),
      };

      const success = await saveServerConfig(serverConfig);

      if (!success) {
        Alert.alert(
          "Error",
          "Failed to save server configuration. Please try again.",
        );
        return;
      }

      const serverInfo = {
        name: "Server",
        ip: formData.ip.trim(),
      };

      setSelectedServer(serverInfo);
      setShowServerManager(false);
      setShowLoginForm(true);
    } catch (error: any) {
      Alert.alert(
        "Error",
        `Failed to save server: ${error?.message || "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-dark-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          className="flex-1 justify-center px-6"
          style={{
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
          }}
        >
          <View className="items-center mb-8">
            <View className="w-16 h-16 bg-dark-bg-button rounded-2xl items-center justify-center mb-4">
              <Server size={32} color="#ffffff" />
            </View>
            <Text className="text-white text-3xl font-bold mb-2">Termix</Text>
            <Text className="text-gray-400 text-center">
              Configure your Termix server connection
            </Text>
          </View>

          <View className="bg-dark-bg-panel rounded-2xl p-6 border border-dark-border-panel">
            <Text className="text-white text-xl font-semibold mb-6">
              Server Configuration
            </Text>

            <View className="space-y-4">
              <View>
                <Text className="text-gray-300 text-sm font-medium mb-3">
                  Server Address
                </Text>
                <View className="relative">
                  <TextInput
                    className={`bg-dark-bg-input rounded-xl text-white border-2 ${
                      connectionStatus === "success"
                        ? "border-green-500"
                        : connectionStatus === "error"
                          ? "border-red-500"
                          : "border-dark-border"
                    }`}
                    style={{
                      height: 56,
                      textAlignVertical: "center",
                      includeFontPadding: false,
                      paddingTop: 0,
                      paddingBottom: 0,
                      paddingLeft: 16,
                      paddingRight: 16,
                    }}
                    placeholder="192.168.1.1:8080 or https://server.com"
                    placeholderTextColor="#9CA3AF"
                    value={formData.ip}
                    onChangeText={(value) => {
                      handleInputChange("ip", value);
                      setConnectionStatus("idle");
                      setErrorMessage("");
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                  />
                  {connectionStatus === "success" && (
                    <View className="absolute right-3 top-1/2 -translate-y-1/2">
                      <CheckCircle size={20} color="#10b981" />
                    </View>
                  )}
                  {connectionStatus === "error" && (
                    <View className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle size={20} color="#ef4444" />
                    </View>
                  )}
                </View>

                {errorMessage ? (
                  <Text className="text-red-400 text-sm mt-2">
                    {errorMessage}
                  </Text>
                ) : (
                  <Text className="text-gray-400 text-xs mt-2">
                    Examples: 192.168.1.100:8080, server.com:8080,
                    https://termix.example.com
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              onPress={testConnection}
              disabled={!formData.ip.trim() || connectionStatus === "testing"}
              className={`flex-row items-center justify-center px-4 py-3 rounded-xl mt-4 ${
                !formData.ip.trim() || connectionStatus === "testing"
                  ? "bg-gray-600"
                  : "bg-blue-600"
              }`}
            >
              <Wifi size={18} color="#ffffff" className="mr-2" />
              <Text className="text-white font-medium">
                {connectionStatus === "testing"
                  ? "Testing..."
                  : "Test Connection"}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mt-8 space-y-3">
            <TouchableOpacity
              onPress={onServerDetailsSubmit}
              disabled={isLoading || connectionStatus !== "success"}
              className={`px-6 py-4 rounded-xl ${
                isLoading || connectionStatus !== "success"
                  ? "bg-gray-600"
                  : "bg-green-600"
              }`}
            >
              <Text className="text-white text-center font-semibold text-lg">
                {isLoading ? "Connecting..." : "Connect to Server"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
