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
        <View
          className={`flex-row items-center gap-2 bg-[#1a1a1a] border border-[#303032] rounded-lg p-3 mb-2 ${
            isActive ? "opacity-70" : ""
          }`}
        >
          {/* Drag Handle */}
          <TouchableOpacity
            onLongPress={drag}
            delayLongPress={250}
            disabled={isActive}
            className="mr-2 px-2 py-2 -ml-1"
            activeOpacity={0.6}
          >
            <Text className="text-gray-400 text-xl">☰</Text>
          </TouchableOpacity>

          {/* Key Preview */}
          <View className="flex-1" pointerEvents="none">
            <View className="flex-row items-center gap-2">
              <View className="bg-[#27272a] border border-[#3f3f46] rounded px-3 py-1.5">
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
            className="bg-red-900/30 border border-red-700 rounded-full w-10 h-10 items-center justify-center ml-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ lineHeight: 0 }}
            activeOpacity={0.6}
          >
            <Text className="text-red-400 font-bold" style={{ fontSize: 20, lineHeight: 20 }}>×</Text>
          </TouchableOpacity>
        </View>
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
    <View style={{ overflow: 'visible' }}>
      <DraggableFlatList
        data={keys}
        onDragEnd={({ data }) => onReorder(data)}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        scrollEnabled={false}
        horizontal={horizontal}
        activationDistance={5}
        containerStyle={{ overflow: 'visible' }}
        dragItemOverflow={true}
      />
      <Text className="text-gray-400 text-xs mt-2 px-1">
        Long press the ☰ icon to reorder
      </Text>
    </View>
  );
}
