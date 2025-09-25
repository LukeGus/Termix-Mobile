import { Stack } from "expo-router";
import { AppProvider, useAppContext } from "./AppContext";
import { TerminalSessionsProvider } from "./contexts/TerminalSessionsContext";
import { KeyboardProvider } from "./contexts/KeyboardContext";
import ServerForm from "./Authentication/ServerForm";
import LoginForm from "./Authentication/LoginForm";
import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
import UpdateRequired from "@/app/Authentication/UpdateRequired";

function RootLayoutContent() {
  const {
    showServerManager,
    showLoginForm,
    isAuthenticated,
    showUpdateScreen,
    isLoading,
  } = useAppContext();

  if (isLoading) {
    return (
      <View className="flex-1 bg-dark-bg justify-center items-center">
        <ActivityIndicator size="large" color="#ffffff" />
        <Text className="text-white text-lg mt-4">Initializing...</Text>
      </View>
    );
  }

  if (showUpdateScreen) {
    return <UpdateRequired />;
  }

  if (showServerManager) {
    return <ServerForm />;
  }

  if (showLoginForm) {
    return <LoginForm />;
  }

  if (isAuthenticated) {
    return (
      <View className="flex-1 bg-dark-bg">
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#18181b" },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </View>
    );
  }

  return <LoginForm />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <TerminalSessionsProvider>
            <KeyboardProvider>
              <RootLayoutContent />
              <Toaster
                theme="dark"
                position="top-center"
                toastOptions={{
                  style: {
                    backgroundColor: "#18181b",
                    borderWidth: 1,
                    borderColor: "#27272a",
                  },
                }}
                richColors={false}
                closeButton={true}
                duration={4000}
              />
            </KeyboardProvider>
          </TerminalSessionsProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
