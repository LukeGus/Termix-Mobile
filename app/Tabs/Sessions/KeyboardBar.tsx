import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { TerminalHandle } from "./Terminal";
import KeyboardKey from "./KeyboardKey";

interface KeyboardBarProps {
  terminalRef: React.RefObject<TerminalHandle | null>;
  isVisible: boolean;
  onModifierChange?: (modifiers: { ctrl: boolean; alt: boolean }) => void;
}

export default function KeyboardBar({
  terminalRef,
  isVisible,
  onModifierChange,
}: KeyboardBarProps) {
  if (!isVisible) return null;

  const [ctrlPressed, setCtrlPressed] = useState(false);
  const [altPressed, setAltPressed] = useState(false);

  const sendKey = (key: string) => {
    terminalRef.current?.sendInput(key);
  };

  const sendSpecialKey = (key: string) => {
    switch (key) {
      case "Escape":
        sendKey("\x1b");
        break;
      case "Tab":
        sendKey("\t");
        break;
      case "Up":
        sendKey("\x1b[A");
        break;
      case "Down":
        sendKey("\x1b[B");
        break;
      case "Right":
        sendKey("\x1b[C");
        break;
      case "Left":
        sendKey("\x1b[D");
        break;
      default:
        sendKey(key);
    }
  };

  const toggleModifier = (modifier: "ctrl" | "alt") => {
    switch (modifier) {
      case "ctrl":
        setCtrlPressed(!ctrlPressed);
        break;
      case "alt":
        setAltPressed(!altPressed);
        break;
    }
  };

  useEffect(() => {
    if (onModifierChange) {
      onModifierChange({ ctrl: ctrlPressed, alt: altPressed });
    }
  }, [ctrlPressed, altPressed]);

  return (
    <View style={styles.keyboardBar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <KeyboardKey label="Esc" onPress={() => sendSpecialKey("Escape")} />
        <KeyboardKey label="Tab" onPress={() => sendSpecialKey("Tab")} />

        <KeyboardKey
          label="Ctrl"
          onPress={() => toggleModifier("ctrl")}
          isModifier={true}
          isActive={ctrlPressed}
        />
        <KeyboardKey
          label="Alt"
          onPress={() => toggleModifier("alt")}
          isModifier={true}
          isActive={altPressed}
        />

        <View style={styles.separator} />

        <KeyboardKey label="↑" onPress={() => sendSpecialKey("Up")} />
        <KeyboardKey label="↓" onPress={() => sendSpecialKey("Down")} />
        <KeyboardKey label="←" onPress={() => sendSpecialKey("Left")} />
        <KeyboardKey label="→" onPress={() => sendSpecialKey("Right")} />

        <View style={styles.separator} />

        <KeyboardKey label="\" onPress={() => sendKey("\\")} />
        <KeyboardKey label="|" onPress={() => sendKey("|")} />
        <KeyboardKey label="~" onPress={() => sendKey("~")} />
        <KeyboardKey label="-" onPress={() => sendKey("-")} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardBar: {
    backgroundColor: "#0e0e10",
    borderTopWidth: 1.5,
    borderTopColor: "#303032",
    height: 50,
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: "center",
    gap: 6,
  },
  separator: {
    width: 1,
    height: 30,
    backgroundColor: "#404040",
    marginHorizontal: 8,
  },
});
