import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableWithoutFeedback,
  Pressable,
  Dimensions,
  BackHandler,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useTerminalSessions } from "@/app/contexts/TerminalSessionsContext";
import { useKeyboard } from "@/app/contexts/KeyboardContext";
import { Terminal, TerminalHandle } from "@/app/Tabs/Sessions/Terminal";
import TabBar from "@/app/Tabs/Sessions/Navigation/TabBar";
import CustomKeyboard from "@/app/Tabs/Sessions/CustomKeyboard";
import KeyboardBar from "@/app/Tabs/Sessions/KeyboardBar";
import { ArrowLeft } from "lucide-react-native";

export default function Sessions() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    sessions,
    activeSessionId,
    setActiveSession,
    removeSession,
    isCustomKeyboardVisible,
    toggleCustomKeyboard,
    lastKeyboardHeight,
    setLastKeyboardHeight,
    keyboardIntentionallyHiddenRef,
    setKeyboardIntentionallyHidden,
  } = useTerminalSessions();
  const { keyboardHeight, isKeyboardVisible } = useKeyboard();
  const hiddenInputRef = useRef<TextInput>(null);
  const terminalRefs = useRef<Record<string, React.RefObject<TerminalHandle>>>(
    {},
  );
  const [activeModifiers, setActiveModifiers] = useState({
    ctrl: false,
    alt: false,
  });
  const [screenDimensions, setScreenDimensions] = useState(
    Dimensions.get("window"),
  );

  useEffect(() => {
    const map: Record<string, React.RefObject<TerminalHandle>> = {
      ...terminalRefs.current,
    };
    sessions.forEach((s) => {
      if (!map[s.id]) {
        map[s.id] =
          React.createRef<TerminalHandle>() as React.RefObject<TerminalHandle>;
      }
    });
    Object.keys(map).forEach((id) => {
      if (!sessions.find((s) => s.id === id)) {
        delete map[id];
      }
    });
    terminalRefs.current = map;
  }, [sessions]);

  useFocusEffect(
    React.useCallback(() => {
      if (
        sessions.length > 0 &&
        !isCustomKeyboardVisible &&
        !keyboardIntentionallyHiddenRef.current
      ) {
        setTimeout(() => {
          hiddenInputRef.current?.focus();
        }, 1000);
      }

      return () => {};
    }, [
      sessions.length,
      isCustomKeyboardVisible,
      keyboardIntentionallyHiddenRef,
    ]),
  );

  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        if (
          sessions.length > 0 &&
          !isCustomKeyboardVisible &&
          !keyboardIntentionallyHiddenRef.current
        ) {
          setTimeout(() => {
            hiddenInputRef.current?.focus();
          }, 50);
        }
      },
    );

    return () => {
      keyboardDidHideListener?.remove();
    };
  }, [
    sessions.length,
    isCustomKeyboardVisible,
    keyboardIntentionallyHiddenRef,
  ]);

  useEffect(() => {
    if (Platform.OS === "android" && sessions.length > 0) {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (isKeyboardVisible && !keyboardIntentionallyHiddenRef.current) {
            setKeyboardIntentionallyHidden(true);
            Keyboard.dismiss();
            return true;
          }
          return false;
        },
      );

      return () => {
        backHandler.remove();
      };
    }
  }, [
    sessions.length,
    isKeyboardVisible,
    keyboardIntentionallyHiddenRef,
    setKeyboardIntentionallyHidden,
  ]);

  useEffect(() => {
    if (
      sessions.length > 0 &&
      !isKeyboardVisible &&
      !isCustomKeyboardVisible &&
      !keyboardIntentionallyHiddenRef.current
    ) {
      const timeoutId = setTimeout(() => {
        hiddenInputRef.current?.focus();
      }, 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [
    isKeyboardVisible,
    sessions.length,
    isCustomKeyboardVisible,
    keyboardIntentionallyHiddenRef,
  ]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenDimensions(window);

      setTimeout(() => {
        const activeRef = activeSessionId
          ? terminalRefs.current[activeSessionId]
          : null;
        activeRef?.current?.fit();

        if (
          sessions.length > 0 &&
          !isCustomKeyboardVisible &&
          !keyboardIntentionallyHiddenRef.current
        ) {
          hiddenInputRef.current?.focus();
        }
      }, 300);
    });

    return () => subscription?.remove();
  }, [
    activeSessionId,
    sessions.length,
    isCustomKeyboardVisible,
    keyboardIntentionallyHiddenRef,
  ]);

  useEffect(() => {
    if (keyboardHeight > 0) {
      setLastKeyboardHeight(keyboardHeight);
    }
  }, [keyboardHeight, setLastKeyboardHeight]);

  useEffect(() => {
    const activeRef = activeSessionId
      ? terminalRefs.current[activeSessionId]
      : null;
    if (activeRef && activeRef.current) {
      setTimeout(() => {
        activeRef.current?.fit();
      }, 0);
    }
  }, [keyboardHeight, activeSessionId, screenDimensions]);

  useFocusEffect(
    React.useCallback(() => {
      if (
        sessions.length > 0 &&
        !isCustomKeyboardVisible &&
        !keyboardIntentionallyHiddenRef.current
      ) {
        setTimeout(() => {
          hiddenInputRef.current?.focus();
          const activeRef = activeSessionId
            ? terminalRefs.current[activeSessionId]
            : null;
          activeRef?.current?.fit();
        }, 0);
      }
    }, [
      sessions.length,
      activeSessionId,
      isCustomKeyboardVisible,
      keyboardIntentionallyHiddenRef,
    ]),
  );

  const handleTabPress = (sessionId: string) => {
    setKeyboardIntentionallyHidden(false);
    hiddenInputRef.current?.focus();
    requestAnimationFrame(() => {
      setActiveSession(sessionId);
      setTimeout(() => hiddenInputRef.current?.focus(), 0);
    });
  };

  const handleTabClose = (sessionId: string) => {
    hiddenInputRef.current?.focus();
    requestAnimationFrame(() => {
      removeSession(sessionId);
      setTimeout(() => hiddenInputRef.current?.focus(), 0);
    });
  };

  const handleAddSession = () => {
    router.navigate("/hosts" as any);
  };

  const handleToggleKeyboard = () => {
    if (isCustomKeyboardVisible) {
      Keyboard.dismiss();
      setTimeout(() => {
        toggleCustomKeyboard();
      }, 100);
    } else {
      setKeyboardIntentionallyHidden(false);
      toggleCustomKeyboard();
    }
  };

  const handleModifierChange = useCallback(
    (modifiers: { ctrl: boolean; alt: boolean }) => {
      setActiveModifiers(modifiers);
    },
    [],
  );

  const activeSession = sessions.find(
    (session) => session.id === activeSessionId,
  );

  return (
    <View
      className="flex-1 bg-dark-bg"
      style={{
        paddingTop: insets.top,
      }}
    >
      <View
        style={{
          flex: 1,
          marginBottom: keyboardIntentionallyHiddenRef.current
            ? 126
            : isCustomKeyboardVisible
              ? lastKeyboardHeight + 115
              : isKeyboardVisible && keyboardHeight > 0
                ? keyboardHeight + 115
                : lastKeyboardHeight > 0
                  ? lastKeyboardHeight + 115
                  : 115,
        }}
      >
        {sessions.map((session) => (
          <Terminal
            key={session.id}
            ref={terminalRefs.current[session.id]}
            hostConfig={{
              id: parseInt(session.host.id.toString()),
              name: session.host.name,
              ip: session.host.ip,
              port: parseInt(session.host.port.toString()),
              username: session.host.username,
              authType: session.host.authType,
              password: session.host.password,
              key: session.host.key,
              keyPassword: session.host.keyPassword,
              keyType: session.host.keyType,
              credentialId: session.host.credentialId
                ? parseInt(session.host.credentialId.toString())
                : undefined,
            }}
            isVisible={session.id === activeSessionId}
            title={session.title}
            onClose={() => handleTabClose(session.id)}
          />
        ))}
      </View>

      {sessions.length === 0 && (
        <View
          style={{
            position: "absolute",
            top: insets.top,
            left: 0,
            right: 0,
            bottom: 115,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
            pointerEvents: "box-none",
            zIndex: 1005,
          }}
        >
          <View
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: 12,
              padding: 32,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#303032",
              minWidth: 280,
              maxWidth: 400,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
              pointerEvents: "box-none",
            }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: 20,
                fontWeight: "600",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              No Active Terminal Sessions
            </Text>
            <Text
              style={{
                color: "#9CA3AF",
                fontSize: 14,
                lineHeight: 20,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              Connect to a host from the Hosts tab to start a terminal session
            </Text>
            <View
              style={{
                backgroundColor: "#22C55E",
                paddingHorizontal: 32,
                paddingVertical: 16,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#16A34A",
                minHeight: 48,
                minWidth: 120,
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1004,
              }}
              onTouchEnd={() => {
                handleAddSession();
              }}
            >
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                Go to Hosts
              </Text>
            </View>
          </View>
        </View>
      )}

      {sessions.length > 0 && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: keyboardIntentionallyHiddenRef.current
              ? 126
              : isCustomKeyboardVisible
                ? lastKeyboardHeight + 115
                : isKeyboardVisible && keyboardHeight > 0
                  ? keyboardHeight + 115
                  : lastKeyboardHeight > 0
                    ? lastKeyboardHeight + 115
                    : 115,
            backgroundColor: "#09090b",
            zIndex: 999,
          }}
        />
      )}

      {sessions.length > 0 && (
        <View
          style={{
            position: "absolute",
            bottom: keyboardIntentionallyHiddenRef.current
              ? 0
              : isCustomKeyboardVisible
                ? lastKeyboardHeight
                : isKeyboardVisible && keyboardHeight > 0
                  ? keyboardHeight
                  : 0,
            left: 0,
            right: 0,
            height: keyboardIntentionallyHiddenRef.current ? 66 : 50,
            zIndex: 999,
          }}
        >
          <KeyboardBar
            terminalRef={
              activeSessionId
                ? terminalRefs.current[activeSessionId]
                : React.createRef<TerminalHandle>()
            }
            isVisible={true}
            onModifierChange={handleModifierChange}
            isKeyboardIntentionallyHidden={
              keyboardIntentionallyHiddenRef.current
            }
          />
        </View>
      )}

      <View
        style={{
          position: "absolute",
          bottom: keyboardIntentionallyHiddenRef.current
            ? 66
            : isCustomKeyboardVisible
              ? lastKeyboardHeight + 50
              : isKeyboardVisible && keyboardHeight > 0
                ? keyboardHeight + 50
                : 50,
          left: 0,
          right: 0,
          height: 60,
          zIndex: 1000,
        }}
      >
        <TabBar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onTabPress={handleTabPress}
          onTabClose={handleTabClose}
          onAddSession={handleAddSession}
          onToggleKeyboard={handleToggleKeyboard}
          isCustomKeyboardVisible={isCustomKeyboardVisible}
          hiddenInputRef={hiddenInputRef}
          onHideKeyboard={() => setKeyboardIntentionallyHidden(true)}
          onShowKeyboard={() => setKeyboardIntentionallyHidden(false)}
          keyboardIntentionallyHiddenRef={keyboardIntentionallyHiddenRef}
        />
      </View>

      {sessions.length > 0 && isCustomKeyboardVisible && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1002,
          }}
        >
          <CustomKeyboard
            terminalRef={
              activeSessionId
                ? terminalRefs.current[activeSessionId]
                : React.createRef<TerminalHandle>()
            }
            isVisible={isCustomKeyboardVisible}
            keyboardHeight={lastKeyboardHeight}
          />
        </View>
      )}

      {sessions.length > 0 &&
        !isCustomKeyboardVisible &&
        !keyboardIntentionallyHiddenRef.current &&
        !isKeyboardVisible && (
          <Pressable
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height:
                keyboardHeight > 0
                  ? keyboardHeight
                  : Math.max(80, screenDimensions.height * 0.1),
              backgroundColor: "#09090b",
              justifyContent: "center",
              alignItems: "center",
              borderTopWidth: 1,
              borderTopColor: "#303032",
              zIndex: 1000,
            }}
            onPress={() => {
              setKeyboardIntentionallyHidden(false);
              hiddenInputRef.current?.focus();
            }}
          >
            <Text
              style={{
                color: "#9CA3AF",
                fontSize: Math.min(14, screenDimensions.width / 30),
                textAlign: "center",
                fontWeight: "500",
                paddingHorizontal: 20,
              }}
            >
              Tap anywhere to bring back the keyboard
            </Text>
          </Pressable>
        )}

      {sessions.length > 0 && !isCustomKeyboardVisible && (
        <TextInput
          ref={hiddenInputRef}
          style={{
            position: "absolute",
            bottom: keyboardHeight > 0 ? keyboardHeight : 0,
            left: 0,
            width: 1,
            height: 1,
            opacity: 0,
            color: "transparent",
            backgroundColor: "transparent",
            zIndex: 1001,
          }}
          pointerEvents="none"
          autoFocus={false}
          showSoftInputOnFocus={true}
          keyboardType="default"
          returnKeyType="default"
          blurOnSubmit={false}
          editable={true}
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          textContentType="none"
          caretHidden
          contextMenuHidden
          underlineColorAndroid="transparent"
          multiline
          onChangeText={(text) => {}}
          onKeyPress={({ nativeEvent }) => {
            const key = nativeEvent.key;
            const activeRef = activeSessionId
              ? terminalRefs.current[activeSessionId]
              : null;
            if (activeRef && activeRef.current) {
              let finalKey = key;

              if (activeModifiers.ctrl) {
                switch (key.toLowerCase()) {
                  case "c":
                    finalKey = "\x03";
                    break;
                  case "d":
                    finalKey = "\x04";
                    break;
                  case "z":
                    finalKey = "\x1a";
                    break;
                  case "l":
                    finalKey = "\x0c";
                    break;
                  case "a":
                    finalKey = "\x01";
                    break;
                  case "e":
                    finalKey = "\x05";
                    break;
                  case "k":
                    finalKey = "\x0b";
                    break;
                  case "u":
                    finalKey = "\x15";
                    break;
                  case "w":
                    finalKey = "\x17";
                    break;
                  default:
                    finalKey = String.fromCharCode(key.charCodeAt(0) & 0x1f);
                }
              } else if (activeModifiers.alt) {
                finalKey = `\x1b${key}`;
              }

              if (key === "Enter") {
                activeRef.current.sendInput("\r");
              } else if (key === "Backspace") {
                activeRef.current.sendInput("\b");
              } else if (key.length === 1) {
                activeRef.current.sendInput(finalKey);
              }
            }
          }}
          onFocus={() => {
            setKeyboardIntentionallyHidden(false);
          }}
          onBlur={() => {
            setTimeout(() => {
              if (
                sessions.length > 0 &&
                !isCustomKeyboardVisible &&
                !keyboardIntentionallyHiddenRef.current
              ) {
                hiddenInputRef.current?.focus();
              }
            }, 100);
          }}
          onSubmitEditing={() => {
            setTimeout(() => {
              if (
                sessions.length > 0 &&
                !isCustomKeyboardVisible &&
                !keyboardIntentionallyHiddenRef.current
              ) {
                hiddenInputRef.current?.focus();
              }
            }, 100);
          }}
        />
      )}
    </View>
  );
}
