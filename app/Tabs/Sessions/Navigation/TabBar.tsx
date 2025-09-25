import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { X, ArrowLeft, Plus, Minus } from "lucide-react-native";
import { TerminalSession } from "@/app/contexts/TerminalSessionsContext";
import { useRouter } from "expo-router";

interface TabBarProps {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  onTabPress: (sessionId: string) => void;
  onTabClose: (sessionId: string) => void;
  onAddSession?: () => void;
  onToggleKeyboard?: () => void;
  isCustomKeyboardVisible: boolean;
  hiddenInputRef: React.RefObject<TextInput | null>;
}

export default function TabBar({
  sessions,
  activeSessionId,
  onTabPress,
  onTabClose,
  onAddSession,
  onToggleKeyboard,
  isCustomKeyboardVisible,
  hiddenInputRef,
}: TabBarProps) {
  const router = useRouter();

  if (sessions.length === 0) {
    return null;
  }

  return (
    <View
      style={{
        backgroundColor: "#0e0e10",
        borderTopWidth: 1.5,
        borderTopColor: "#303032",
        minHeight: 60,
        maxHeight: 60,
      }}
      onStartShouldSetResponder={() => true}
      onResponderGrant={() => {
        hiddenInputRef.current?.focus();
      }}
      onResponderTerminationRequest={() => false}
      onTouchEndCapture={() => hiddenInputRef.current?.focus()}
      focusable={false}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          height: "100%",
          paddingHorizontal: 8,
        }}
      >
        <TouchableOpacity
          onPressIn={() => hiddenInputRef.current?.focus()}
          onPress={() => router.navigate("/hosts" as any)}
          onPressOut={() => hiddenInputRef.current?.focus()}
          focusable={false}
          className="items-center justify-center rounded-md"
          activeOpacity={0.7}
          style={{
            width: 44,
            height: 44,
            borderWidth: 2,
            borderColor: "#303032",
            backgroundColor: "#2a2a2a",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
            marginRight: 8,
          }}
        >
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>

        <ScrollView
          horizontal
          keyboardShouldPersistTaps="always"
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          focusable={false}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingVertical: 8,
            gap: 6,
            alignItems: "center",
          }}
          className="flex-row"
          scrollEnabled={true}
          directionalLockEnabled={true}
          nestedScrollEnabled={false}
          alwaysBounceVertical={false}
          bounces={false}
          bouncesZoom={false}
          scrollEventThrottle={16}
          removeClippedSubviews={false}
        >
          {sessions.map((session) => {
            const isActive = session.id === activeSessionId;

            return (
              <TouchableOpacity
                key={session.id}
                onPressIn={() => hiddenInputRef.current?.focus()}
                onPress={() => onTabPress(session.id)}
                onPressOut={() => hiddenInputRef.current?.focus()}
                focusable={false}
                className="flex-row items-center rounded-md"
                style={{
                  borderWidth: 2,
                  borderColor: "#303032",
                  backgroundColor: isActive ? "#2a2a2a" : "#1a1a1a",
                  shadowColor: isActive ? "#000" : "transparent",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isActive ? 0.1 : 0,
                  shadowRadius: 4,
                  elevation: isActive ? 2 : 0,
                  minWidth: 120,
                  height: 44,
                }}
              >
                <View className="flex-1 px-3 py-2">
                  <Text
                    className={`text-sm font-medium ${
                      isActive ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {session.title}
                  </Text>
                </View>

                {/* Close button */}
                <TouchableOpacity
                  onPressIn={() => hiddenInputRef.current?.focus()}
                  onPress={(e) => {
                    e.stopPropagation();
                    onTabClose(session.id);
                  }}
                  onPressOut={() => hiddenInputRef.current?.focus()}
                  focusable={false}
                  className="items-center justify-center"
                  activeOpacity={0.7}
                  style={{
                    width: 36,
                    height: 44,
                    borderLeftWidth: 1,
                    borderLeftColor: "#303032",
                  }}
                >
                  <X
                    size={16}
                    color={isActive ? "#ffffff" : "#9CA3AF"}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          onPressIn={() => hiddenInputRef.current?.focus()}
          onPress={() => onToggleKeyboard?.()}
          onPressOut={() => hiddenInputRef.current?.focus()}
          focusable={false}
          className="items-center justify-center rounded-md"
          activeOpacity={0.7}
          style={{
            width: 44,
            height: 44,
            borderWidth: 2,
            borderColor: "#303032",
            backgroundColor: "#2a2a2a",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
            marginLeft: 8,
          }}
        >
          {isCustomKeyboardVisible ? (
            <Minus size={20} color="#ffffff" />
          ) : (
            <Plus size={20} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
