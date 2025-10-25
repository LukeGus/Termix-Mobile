import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTerminalCustomization } from "@/app/contexts/TerminalCustomizationContext";
import { showToast } from "@/app/utils/toast";

const FONT_SIZE_OPTIONS = [
  { label: "Extra Small", value: 12 },
  { label: "Small", value: 14 },
  { label: "Medium", value: 16 },
  { label: "Large", value: 18 },
  { label: "Extra Large", value: 20 },
  { label: "Huge", value: 24 },
];

export default function TerminalCustomization() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { config, updateFontSize, resetToDefault } = useTerminalCustomization();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Handle font size change
  const handleFontSizeChange = async (fontSize: number) => {
    try {
      await updateFontSize(fontSize);
      showToast.success(`Font size updated to ${fontSize}px`);
    } catch (error) {
      showToast.error("Failed to update font size");
    }
  };

  // Handle reset
  const handleReset = async () => {
    try {
      await resetToDefault();
      showToast.success("Terminal settings reset to default");
      setShowResetConfirm(false);
    } catch (error) {
      showToast.error("Failed to reset settings");
    }
  };

  return (
    <View className="flex-1 bg-[#18181b]">
      {/* Header */}
      <View
        className="bg-[#1a1a1a] border-b border-[#303032] px-4"
        style={{ paddingTop: insets.top + 12, paddingBottom: 12 }}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-green-500 text-base font-semibold">← Back</Text>
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold">Terminal Customization</Text>
          <View style={{ width: 60 }} />
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-4 py-4">
        <Text className="text-white text-lg font-semibold mb-2">Terminal Settings</Text>
        <Text className="text-gray-400 text-sm mb-4">
          Customize terminal appearance and behavior
        </Text>

        {/* Font Size */}
        <View className="mb-6">
          <Text className="text-white text-base font-semibold mb-3">Font Size</Text>
          <Text className="text-gray-400 text-sm mb-3">
            Base font size for terminal text. The actual size will be adjusted based on your screen width.
          </Text>
          <View className="gap-2">
            {FONT_SIZE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => handleFontSizeChange(option.value)}
                className={`p-4 rounded-lg border ${
                  config.fontSize === option.value
                    ? "bg-green-900/20 border-green-500"
                    : "bg-[#1a1a1a] border-[#303032]"
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text
                      className={`text-base font-semibold ${
                        config.fontSize === option.value ? "text-green-400" : "text-white"
                      }`}
                    >
                      {option.label}
                    </Text>
                    <Text className="text-gray-400 text-xs mt-0.5">
                      {option.value}px base size
                    </Text>
                  </View>
                  {config.fontSize === option.value && (
                    <View className="bg-green-500 rounded-full px-2 py-1">
                      <Text className="text-white text-xs font-semibold">ACTIVE</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reset Button */}
        <TouchableOpacity
          onPress={() => setShowResetConfirm(true)}
          className="bg-red-900/20 border border-red-700 rounded-lg p-3"
        >
          <Text className="text-red-400 text-center font-semibold">Reset to Default</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Reset Confirmation Modal */}
      <Modal
        visible={showResetConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetConfirm(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={() => setShowResetConfirm(false)}
        >
          <Pressable className="bg-[#1a1a1a] rounded-lg p-6 mx-8 border border-[#303032]">
            <Text className="text-white text-lg font-semibold mb-2">Confirm Reset</Text>
            <Text className="text-gray-400 text-sm mb-6">
              This will reset all terminal customizations to default settings.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowResetConfirm(false)}
                className="flex-1 bg-[#27272a] border border-[#3f3f46] rounded-lg p-3"
              >
                <Text className="text-white text-center font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleReset}
                className="flex-1 bg-red-600 rounded-lg p-3"
              >
                <Text className="text-white text-center font-semibold">Reset</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
