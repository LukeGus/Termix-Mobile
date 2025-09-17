import { Stack } from "expo-router";
import { AppProvider, useAppContext } from "./AppContext";
import ServerManager from "./ServerManager";

function RootLayoutContent() {
  const { showServerManager } = useAppContext();

  if (showServerManager) {
    return <ServerManager />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
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