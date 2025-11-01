import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Keyboard,
} from "react-native";
import {
  X,
  ArrowLeft,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { TerminalSession } from "@/app/contexts/TerminalSessionsContext";
import { useRouter } from "expo-router";
import { useKeyboard } from "@/app/contexts/KeyboardContext";

interface TabBarProps {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  onTabPress: (sessionId: string) => void;
  onTabClose: (sessionId: string) => void;
  onAddSession?: () => void;
  onToggleKeyboard?: () => void;
  isCustomKeyboardVisible: boolean;
  hiddenInputRef: React.RefObject<TextInput | null>;
  onHideKeyboard?: () => void;
  onShowKeyboard?: () => void;
  keyboardIntentionallyHiddenRef: React.MutableRefObject<boolean>;
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
  onHideKeyboard,
  onShowKeyboard,
  keyboardIntentionallyHiddenRef,
}: TabBarProps) {
  const router = useRouter();
  const { isKeyboardVisible } = useKeyboard();

  const handleToggleSystemKeyboard = () => {
    if (keyboardIntentionallyHiddenRef.current) {
      onShowKeyboard?.();
      setTimeout(() => {
        hiddenInputRef.current?.focus();
      }, 50);
    } else {
      onHideKeyboard?.();
      Keyboard.dismiss();
    }
  };

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
          onPress={() => router.navigate("/hosts" as any)}
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

        <View style={{ flex: 1, justifyContent: "center" }}>
          <ScrollView
            horizontal
            keyboardShouldPersistTaps="always"
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            focusable={false}
            contentContainerStyle={{
              paddingHorizontal: 0,
              gap: 6,
              alignItems: "center",
            }}
            className="flex-row"
            scrollEnabled={true}
            directionalLockEnabled={true}
            nestedScrollEnabled={false}
            alwaysBounceVertical={false}
            alwaysBounceHorizontal={false}
            bounces={false}
            bouncesZoom={false}
            scrollEventThrottle={16}
            removeClippedSubviews={false}
            overScrollMode="never"
            disableIntervalMomentum={true}
            pagingEnabled={false}
          >
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;

              return (
                <TouchableOpacity
                  key={session.id}
                  onPress={() => onTabPress(session.id)}
                  focusable={false}
                  className="flex-row items-center rounded-md"
                  style={{
                    borderWidth: 2,
                    borderColor: isActive ? "#22c55e" : "#303032",
                    backgroundColor: isActive ? "#1a1a1a" : "#1a1a1a",
                    shadowColor: isActive ? "#22c55e" : "transparent",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isActive ? 0.2 : 0,
                    shadowRadius: 4,
                    elevation: isActive ? 3 : 0,
                    minWidth: 120,
                    height: 44,
                  }}
                >
                  <View className="flex-1 px-3 py-2">
                    <Text
                      className={`text-sm font-medium ${
                        isActive ? "text-green-400" : "text-gray-400"
                      }`}
                    >
                      {session.title}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      onTabClose(session.id);
                    }}
                    focusable={false}
                    className="items-center justify-center"
                    activeOpacity={0.7}
                    style={{
                      width: 36,
                      height: 44,
                      borderLeftWidth: 2,
                      borderLeftColor: isActive ? "#22c55e" : "#303032",
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
        </View>

        {!isCustomKeyboardVisible && (
          <TouchableOpacity
            onPress={handleToggleSystemKeyboard}
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
            {keyboardIntentionallyHiddenRef.current ? (
              <ChevronUp size={20} color="#ffffff" />
            ) : (
              <ChevronDown size={20} color="#ffffff" />
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => onToggleKeyboard?.()}
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
