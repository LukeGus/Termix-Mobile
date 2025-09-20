import { Stack } from "expo-router";
import { AppProvider, useAppContext } from "./AppContext";
import { TerminalSessionsProvider } from "./contexts/TerminalSessionsContext";
import ServerForm from "./Authentication/ServerForm";
import LoginForm from "./Authentication/LoginForm";
import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

function RootLayoutContent() {
  const { showServerManager, showLoginForm, isAuthenticated, isLoading } = useAppContext();

  if (isLoading) {
    return (
      <View className="flex-1 bg-dark-bg justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-white text-lg mt-4">Initializing...</Text>
      </View>
    );
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
            contentStyle: { backgroundColor: '#18181b' },
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
    <SafeAreaProvider>
      <AppProvider>
        <TerminalSessionsProvider>
          <RootLayoutContent />
        </TerminalSessionsProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}