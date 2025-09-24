import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface KeyboardKeyProps {
  label: string;
  onPress: () => void;
  style?: any;
  textStyle?: any;
  isActive?: boolean;
  isModifier?: boolean;
}

export default function KeyboardKey({ 
  label, 
  onPress, 
  style = {}, 
  textStyle = {}, 
  isActive = false,
  isModifier = false 
}: KeyboardKeyProps) {
  return (
    <TouchableOpacity
      style={[
        styles.keyButton,
        isModifier && styles.modifierKey,
        isActive && styles.activeKey,
        style
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.keyText, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  keyButton: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  modifierKey: {
    backgroundColor: '#2a2a2a',
    borderColor: '#404040',
  },
  activeKey: {
    backgroundColor: '#4a4a4a',
    borderColor: '#606060',
    shadowOpacity: 0.3,
  },
  keyText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
