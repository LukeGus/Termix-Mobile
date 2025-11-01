import React, { createContext, useContext, useState, useEffect } from "react";
import { Keyboard, Platform, Dimensions } from "react-native";

interface KeyboardContextType {
  keyboardHeight: number;
  isKeyboardVisible: boolean;
  showKeyboard: () => void;
}

const KeyboardContext = createContext<KeyboardContextType>({
  keyboardHeight: 0,
  isKeyboardVisible: false,
  showKeyboard: () => {},
});

export const KeyboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const showKeyboard = () => {
    if (Platform.OS === "android") {
      setIsKeyboardVisible(true);
    }
  };

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillChangeFrame" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardShowListener = Keyboard.addListener(showEvent, (e) => {
      const screenHeight = Dimensions.get("screen").height;
      const keyboardTop = e.endCoordinates.screenY;
      let newHeight = 0;
      if (Platform.OS === "android") {
        newHeight = screenHeight - keyboardTop;
      } else {
        newHeight = e.endCoordinates.height;
      }

      if (newHeight > 0) {
        setKeyboardHeight(newHeight);
        setIsKeyboardVisible(true);
      }
    });

    const keyboardHideListener = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      keyboardShowListener?.remove();
      keyboardHideListener?.remove();
    };
  }, []);

  return (
    <KeyboardContext.Provider
      value={{ keyboardHeight, isKeyboardVisible, showKeyboard }}
    >
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
