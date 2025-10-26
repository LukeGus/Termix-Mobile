import React, { createContext, useContext, useState, useEffect } from "react";
import { Keyboard, Platform } from "react-native";

interface KeyboardContextType {
  keyboardHeight: number;
  isKeyboardVisible: boolean;
}

const KeyboardContext = createContext<KeyboardContextType>({
  keyboardHeight: 0,
  isKeyboardVisible: false,
});

export const KeyboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillChangeFrame" : "keyboardDidShow";

    const keyboardShowListener = Keyboard.addListener(
      showEvent,
      (e) => {
        const newHeight = e.endCoordinates.height;
        if (newHeight > 0) {
          setKeyboardHeight(newHeight);
          setIsKeyboardVisible(true);
        }
      },
    );

    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        const newHeight = e.endCoordinates.height;
        if (newHeight > 0) {
          setKeyboardHeight(newHeight);
          setIsKeyboardVisible(true);
        }
      },
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setIsKeyboardVisible(false);
      },
    );

    return () => {
      keyboardShowListener?.remove();
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  return (
    <KeyboardContext.Provider value={{ keyboardHeight, isKeyboardVisible }}>
      {children}
    </KeyboardContext.Provider>
  );
};

export const useKeyboard = () => {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error("useKeyboard must be used within a KeyboardProvider");
  }
  return context;
};
