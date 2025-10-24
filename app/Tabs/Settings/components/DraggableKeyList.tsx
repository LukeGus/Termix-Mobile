import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { KeyConfig } from "@/types/keyboard";

interface DraggableKeyListProps {
  keys: KeyConfig[];
  onReorder: (keys: KeyConfig[]) => void;
  onRemove: (keyId: string) => void;
  emptyMessage?: string;
  horizontal?: boolean;
}

export default function DraggableKeyList({
  keys,
  onReorder,
  onRemove,
  emptyMessage = "No keys yet",
  horizontal = false,
}: DraggableKeyListProps) {
  const renderItem = ({ item, drag, isActive }: RenderItemParams<KeyConfig>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          className={`flex-row items-center gap-2 bg-[#27272a] border border-[#3f3f46] rounded-lg p-3 mb-2 ${
            isActive ? "opacity-70" : ""
          }`}
        >
          {/* Drag Handle */}
          <View className="mr-2">
            <Text className="text-gray-400 text-lg">☰</Text>
          </View>

          {/* Key Preview */}
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <View className="bg-[#1a1a1a] border border-[#404040] rounded px-3 py-1.5">
                <Text className="text-white text-sm font-mono">{item.label}</Text>
              </View>
              <Text className="text-gray-500 text-xs">{item.category}</Text>
            </View>
            {item.description && (
              <Text className="text-gray-400 text-xs mt-1" numberOfLines={1}>
                {item.description}
              </Text>
            )}
          </View>

          {/* Remove Button */}
          <TouchableOpacity
            onPress={() => onRemove(item.id)}
            className="bg-red-900/30 border border-red-700 rounded-full w-8 h-8 items-center justify-center ml-2"
          >
            <Text className="text-red-400 text-base font-bold">×</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  if (keys.length === 0) {
    return (
      <View className="py-6 px-4 bg-[#1a1a1a] border border-[#303032] rounded-lg">
        <Text className="text-gray-500 text-center text-sm">{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View>
      <DraggableFlatList
        data={keys}
        onDragEnd={({ data }) => onReorder(data)}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        scrollEnabled={false}
        horizontal={horizontal}
      />
      <Text className="text-gray-400 text-xs mt-2 px-1">
        Long press and drag to reorder
      </Text>
    </View>
  );
}
