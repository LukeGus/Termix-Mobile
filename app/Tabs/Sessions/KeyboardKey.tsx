import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { KeySize } from "@/types/keyboard";

interface KeyboardKeyProps {
  label: string;
  onPress: () => void;
  style?: any;
  textStyle?: any;
  isActive?: boolean;
  isModifier?: boolean;
  keySize?: KeySize;
  hapticFeedback?: boolean;
  onLongPress?: () => void;
}

export default function KeyboardKey({
  label,
  onPress,
  style = {},
  textStyle = {},
  isActive = false,
  isModifier = false,
  keySize = "medium",
  hapticFeedback = false,
  onLongPress,
}: KeyboardKeyProps) {
  const handlePress = () => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const handleLongPress = () => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (onLongPress) {
      onLongPress();
    }
  };

  const sizeStyles = getSizeStyles(keySize);

  return (
    <TouchableOpacity
      style={[
        styles.keyButton,
        sizeStyles.button,
        isModifier && styles.modifierKey,
        isActive && styles.activeKey,
        style,
      ]}
      onPress={handlePress}
      onLongPress={onLongPress ? handleLongPress : undefined}
      activeOpacity={0.7}
      delayLongPress={500}
    >
      <Text style={[styles.keyText, sizeStyles.text, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}

function getSizeStyles(size: KeySize) {
  switch (size) {
    case "small":
      return {
        button: {
          paddingHorizontal: 6,
          paddingVertical: 6,
          minWidth: 32,
          minHeight: 32,
        },
        text: {
          fontSize: 11,
        },
      };
    case "large":
      return {
        button: {
          paddingHorizontal: 10,
          paddingVertical: 10,
          minWidth: 42,
          minHeight: 42,
        },
        text: {
          fontSize: 14,
        },
      };
    case "medium":
    default:
      return {
        button: {
          paddingHorizontal: 8,
          paddingVertical: 8,
          minWidth: 36,
          minHeight: 36,
        },
        text: {
          fontSize: 12,
        },
      };
  }
}

const styles = StyleSheet.create({
  keyButton: {
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#404040",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  modifierKey: {
    backgroundColor: "#2a2a2a",
    borderColor: "#404040",
  },
  activeKey: {
    backgroundColor: "#4a4a4a",
    borderColor: "#606060",
    shadowOpacity: 0.3,
  },
  keyText: {
    color: "#ffffff",
    fontWeight: "500",
    textAlign: "center",
  },
});
