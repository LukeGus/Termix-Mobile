import { Stack } from "expo-router";
import { AppProvider, useAppContext } from "./AppContext";
import ServerForm from "./ServerForm";
import LoginForm from "./LoginForm";
import "../global.css";

function RootLayoutContent() {
  const { showServerManager, showLoginForm } = useAppContext();

  if (showServerManager) {
    return <ServerForm />;
  }

  if (showLoginForm) {
    return <LoginForm />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootLayoutContent />
    </AppProvider>
  );
}