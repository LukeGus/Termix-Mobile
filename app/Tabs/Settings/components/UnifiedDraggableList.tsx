import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";

export type UnifiedListItem =
  | { type: 'header'; id: string; title: string; subtitle?: string; onAddPress?: () => void; addButtonLabel?: string }
  | { type: 'draggable-key'; id: string; data: any; section: string; renderItem: (item: any, onRemove: () => void, drag: () => void, isActive: boolean) => React.ReactNode }
  | { type: 'draggable-row'; id: string; data: any; renderItem: (item: any, drag: () => void, isActive: boolean) => React.ReactNode }
  | { type: 'button'; id: string; label: string; onPress: () => void; variant?: 'danger' | 'normal' }
  | { type: 'spacer'; id: string; height: number };

interface UnifiedDraggableListProps {
  data: UnifiedListItem[];
  onDragEnd: (data: UnifiedListItem[]) => void;
  onRemoveKey?: (itemId: string, section: string) => void;
}

export default function UnifiedDraggableList({
  data,
  onDragEnd,
  onRemoveKey,
}: UnifiedDraggableListProps) {

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<UnifiedListItem>) => {
    // Header - not draggable
    if (item.type === 'header') {
      return (
        <View className="mb-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-white text-lg font-semibold">{item.title}</Text>
              {item.subtitle && (
                <Text className="text-gray-400 text-xs mt-0.5">{item.subtitle}</Text>
              )}
            </View>
            {item.onAddPress && (
              <TouchableOpacity
                onPress={item.onAddPress}
                className="bg-green-600 rounded-lg px-4 py-2"
              >
                <Text className="text-white text-sm font-semibold">
                  {item.addButtonLabel || '+ Add'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    // Draggable Key Item
    if (item.type === 'draggable-key') {
      return (
        <ScaleDecorator>
          <View style={{ opacity: isActive ? 0.5 : 1 }}>
            {item.renderItem(
              item.data,
              () => onRemoveKey?.(item.id, item.section),
              drag,
              isActive
            )}
          </View>
        </ScaleDecorator>
      );
    }

    // Draggable Row Item
    if (item.type === 'draggable-row') {
      return (
        <ScaleDecorator>
          <View style={{ opacity: isActive ? 0.5 : 1 }}>
            {item.renderItem(item.data, drag, isActive)}
          </View>
        </ScaleDecorator>
      );
    }

    // Regular Button
    if (item.type === 'button') {
      const isDanger = item.variant === 'danger';
      return (
        <TouchableOpacity
          onPress={item.onPress}
          className={`rounded-lg p-3 mb-3 ${
            isDanger
              ? 'bg-red-900/20 border border-red-700'
              : 'bg-[#27272a] border border-[#3f3f46]'
          }`}
        >
          <Text className={`text-center font-semibold ${
            isDanger ? 'text-red-400' : 'text-white'
          }`}>
            {item.label}
          </Text>
        </TouchableOpacity>
      );
    }

    // Spacer
    if (item.type === 'spacer') {
      return <View style={{ height: item.height }} />;
    }

    return null;
  };

  return (
    <DraggableFlatList
      data={data}
      onDragEnd={({ data: newData }) => onDragEnd(newData)}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    />
  );
}
