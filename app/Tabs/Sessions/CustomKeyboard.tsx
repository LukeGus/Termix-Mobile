import React from "react";
import { View, StyleSheet, ScrollView, Clipboard } from "react-native";
import { TerminalHandle } from "./Terminal";
import KeyboardKey from "./KeyboardKey";

interface CustomKeyboardProps {
  terminalRef: React.RefObject<TerminalHandle | null>;
  isVisible: boolean;
  keyboardHeight: number;
}

export default function CustomKeyboard({
  terminalRef,
  isVisible,
  keyboardHeight,
}: CustomKeyboardProps) {
  if (!isVisible) return null;

  const sendKey = (key: string) => {
    terminalRef.current?.sendInput(key);
  };

  const sendSpecialKey = (key: string) => {
    switch (key) {
      case "Enter":
        sendKey("\r");
        break;
      case "Backspace":
        sendKey("\b");
        break;
      case "Home":
        sendKey("\x1b[H");
        break;
      case "End":
        sendKey("\x1b[F");
        break;
      case "PageUp":
        sendKey("\x1b[5~");
        break;
      case "PageDown":
        sendKey("\x1b[6~");
        break;
      case "Delete":
        sendKey("\x1b[3~");
        break;
      case "Insert":
        sendKey("\x1b[2~");
        break;
      case "Clear":
        sendKey("\x0c");
        break;
      default:
        sendKey(key);
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardContent = await Clipboard.getString();
      if (clipboardContent) {
        sendKey(clipboardContent);
      }
    } catch (error) {}
  };

  return (
    <View style={[styles.keyboard, { height: keyboardHeight }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.keyRow}>
          <KeyboardKey label="F1" onPress={() => sendKey("\x1bOP")} />
          <KeyboardKey label="F2" onPress={() => sendKey("\x1bOQ")} />
          <KeyboardKey label="F3" onPress={() => sendKey("\x1bOR")} />
          <KeyboardKey label="F4" onPress={() => sendKey("\x1bOS")} />
          <KeyboardKey label="F5" onPress={() => sendKey("\x1b[15~")} />
          <KeyboardKey label="F6" onPress={() => sendKey("\x1b[17~")} />
          <KeyboardKey label="F7" onPress={() => sendKey("\x1b[18~")} />
          <KeyboardKey label="F8" onPress={() => sendKey("\x1b[19~")} />
          <KeyboardKey label="F9" onPress={() => sendKey("\x1b[20~")} />
          <KeyboardKey label="F10" onPress={() => sendKey("\x1b[21~")} />
          <KeyboardKey label="F11" onPress={() => sendKey("\x1b[23~")} />
          <KeyboardKey label="F12" onPress={() => sendKey("\x1b[24~")} />
        </View>

        <View style={styles.separator} />

        <View style={styles.keyRow}>
          <KeyboardKey
            label="Insert"
            onPress={() => sendSpecialKey("Insert")}
          />
          <KeyboardKey label="Home" onPress={() => sendSpecialKey("Home")} />
          <KeyboardKey
            label="PageUp"
            onPress={() => sendSpecialKey("PageUp")}
          />
          <KeyboardKey
            label="Delete"
            onPress={() => sendSpecialKey("Delete")}
          />
          <KeyboardKey label="End" onPress={() => sendSpecialKey("End")} />
          <KeyboardKey
            label="PageDown"
            onPress={() => sendSpecialKey("PageDown")}
          />
        </View>

        <View style={styles.separator} />

        <View style={styles.keyRow}>
          <KeyboardKey label="Paste" onPress={handlePaste} />
          <KeyboardKey label="Clear" onPress={() => sendSpecialKey("Clear")} />
          <KeyboardKey label="History" onPress={() => sendKey("\x1b[A")} />
          <KeyboardKey label="Complete" onPress={() => sendKey("\t")} />
          <KeyboardKey label="Suspend" onPress={() => sendKey("\x1a")} />
        </View>

        <View style={styles.separator} />

        <View style={styles.numberRow}>
          <KeyboardKey
            label="1"
            onPress={() => sendKey("1")}
            style={styles.numberKey}
          />
          <KeyboardKey
            label="2"
            onPress={() => sendKey("2")}
            style={styles.numberKey}
          />
          <KeyboardKey
            label="3"
            onPress={() => sendKey("3")}
            style={styles.numberKey}
          />
          <KeyboardKey
            label="4"
            onPress={() => sendKey("4")}
            style={styles.numberKey}
          />
          <KeyboardKey
            label="5"
            onPress={() => sendKey("5")}
            style={styles.numberKey}
          />
          <KeyboardKey
            label="6"
            onPress={() => sendKey("6")}
            style={styles.numberKey}
          />
          <KeyboardKey
            label="7"
            onPress={() => sendKey("7")}
            style={styles.numberKey}
          />
          <KeyboardKey
            label="8"
            onPress={() => sendKey("8")}
            style={styles.numberKey}
          />
          <KeyboardKey
            label="9"
            onPress={() => sendKey("9")}
            style={styles.numberKey}
          />
          <KeyboardKey
            label="0"
            onPress={() => sendKey("0")}
            style={styles.numberKey}
          />
        </View>

        <View style={styles.separator} />

        <View style={styles.keyRow}>
          <KeyboardKey label="`" onPress={() => sendKey("`")} />
          <KeyboardKey label="~" onPress={() => sendKey("~")} />
          <KeyboardKey label="!" onPress={() => sendKey("!")} />
          <KeyboardKey label="@" onPress={() => sendKey("@")} />
          <KeyboardKey label="#" onPress={() => sendKey("#")} />
          <KeyboardKey label="$" onPress={() => sendKey("$")} />
          <KeyboardKey label="%" onPress={() => sendKey("%")} />
          <KeyboardKey label="^" onPress={() => sendKey("^")} />
          <KeyboardKey label="&" onPress={() => sendKey("&")} />
          <KeyboardKey label="*" onPress={() => sendKey("*")} />
          <KeyboardKey label="(" onPress={() => sendKey("(")} />
          <KeyboardKey label=")" onPress={() => sendKey(")")} />
        </View>

        <View style={styles.separator} />

        <View style={styles.keyRow}>
          <KeyboardKey label="-" onPress={() => sendKey("-")} />
          <KeyboardKey label="_" onPress={() => sendKey("_")} />
          <KeyboardKey label="=" onPress={() => sendKey("=")} />
          <KeyboardKey label="+" onPress={() => sendKey("+")} />
          <KeyboardKey label="[" onPress={() => sendKey("[")} />
          <KeyboardKey label="{" onPress={() => sendKey("{")} />
          <KeyboardKey label="]" onPress={() => sendKey("]")} />
          <KeyboardKey label="}" onPress={() => sendKey("}")} />
          <KeyboardKey label="\\" onPress={() => sendKey("\\")} />
          <KeyboardKey label="|" onPress={() => sendKey("|")} />
          <KeyboardKey label=";" onPress={() => sendKey(";")} />
          <KeyboardKey label=":" onPress={() => sendKey(":")} />
        </View>

        <View style={styles.separator} />

        <View style={styles.keyRow}>
          <KeyboardKey label="'" onPress={() => sendKey("'")} />
          <KeyboardKey label='"' onPress={() => sendKey('"')} />
          <KeyboardKey label="," onPress={() => sendKey(",")} />
          <KeyboardKey label="<" onPress={() => sendKey("<")} />
          <KeyboardKey label="." onPress={() => sendKey(".")} />
          <KeyboardKey label=">" onPress={() => sendKey(">")} />
          <KeyboardKey label="/" onPress={() => sendKey("/")} />
          <KeyboardKey label="?" onPress={() => sendKey("?")} />
        </View>

        <View style={styles.separator} />

        <View style={styles.keyRow}>
          <KeyboardKey label="Enter" onPress={() => sendSpecialKey("Enter")} />
          <KeyboardKey label="Space" onPress={() => sendKey(" ")} />
          <KeyboardKey
            label="Backspace"
            onPress={() => sendSpecialKey("Backspace")}
          />
        </View>

        <View style={styles.separator} />

        <View style={styles.keyRow}>
          <KeyboardKey label="Ctrl+C" onPress={() => sendKey("\x03")} />
          <KeyboardKey label="Ctrl+D" onPress={() => sendKey("\x04")} />
          <KeyboardKey label="Ctrl+Z" onPress={() => sendKey("\x1a")} />
          <KeyboardKey label="Ctrl+L" onPress={() => sendKey("\x0c")} />
          <KeyboardKey label="Ctrl+A" onPress={() => sendKey("\x01")} />
          <KeyboardKey label="Ctrl+E" onPress={() => sendKey("\x05")} />
          <KeyboardKey label="Ctrl+K" onPress={() => sendKey("\x0b")} />
          <KeyboardKey label="Ctrl+U" onPress={() => sendKey("\x15")} />
          <KeyboardKey label="Ctrl+W" onPress={() => sendKey("\x17")} />
          <KeyboardKey label="Ctrl+R" onPress={() => sendKey("\x12")} />
          <KeyboardKey label="Ctrl+Y" onPress={() => sendKey("\x19")} />
          <KeyboardKey label="Alt+F" onPress={() => sendKey("\x1bf")} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    backgroundColor: "#0e0e10",
    borderTopWidth: 1.5,
    borderTopColor: "#303032",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexGrow: 1,
  },
  keyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
    gap: 4,
    flexWrap: "wrap",
  },
  numberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
    gap: 3,
    flexWrap: "nowrap",
  },
  numberKey: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 4,
  },
  separator: {
    height: 1,
    backgroundColor: "#404040",
    marginVertical: 8,
    marginHorizontal: 0,
  },
});
