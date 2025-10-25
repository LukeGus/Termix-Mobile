import React, { useState } from "react";
import { View, Text, TouchableOpacity, Switch } from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { KeyboardRow, KeyConfig } from "@/types/keyboard";
import DraggableKeyList from "./DraggableKeyList";

interface DraggableRowListProps {
  rows: KeyboardRow[];
  onReorder: (rows: KeyboardRow[]) => void;
  onToggleVisibility: (rowId: string) => void;
  onRemoveKey: (rowId: string, keyId: string) => void;
  onReorderKeys: (rowId: string, keys: KeyConfig[]) => void;
  onAddKeyToRow?: (rowId: string) => void;
}

export default function DraggableRowList({
  rows,
  onReorder,
  onToggleVisibility,
  onRemoveKey,
  onReorderKeys,
  onAddKeyToRow,
}: DraggableRowListProps) {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const toggleExpand = (rowId: string) => {
    setExpandedRowId(expandedRowId === rowId ? null : rowId);
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<KeyboardRow>) => {
    const isExpanded = expandedRowId === item.id;

    return (
      <ScaleDecorator>
        <View
          className={`bg-[#1a1a1a] border border-[#303032] rounded-lg mb-3 ${
            isActive ? "opacity-70" : ""
          }`}
          pointerEvents="box-none"
        >
          {/* Row Header */}
          <View className="flex-row items-center p-4" pointerEvents="box-none">
            {/* Drag Handle */}
            <TouchableOpacity
              onLongPress={drag}
              delayLongPress={150}
              disabled={isActive}
              className="mr-3 py-1 px-1"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              pointerEvents="auto"
            >
              <Text className="text-gray-400 text-lg">☰</Text>
            </TouchableOpacity>

            {/* Tappable Row Content */}
            <TouchableOpacity
              onPress={() => toggleExpand(item.id)}
              className="flex-1 flex-row items-center"
              disabled={isActive}
              pointerEvents="auto"
            >
              {/* Row Info */}
              <View className="flex-1 mr-4">
                <Text className="text-white text-base font-semibold">{item.label}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">
                  {item.keys.length} keys • {item.category}
                </Text>
              </View>

              {/* Expand Indicator */}
              <View className="ml-3">
                <Text className="text-gray-400 text-base">
                  {isExpanded ? "▼" : "▶"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Visibility Toggle */}
            <Switch
              value={item.visible}
              onValueChange={() => onToggleVisibility(item.id)}
              trackColor={{ false: "#3f3f46", true: "#22C55E" }}
              thumbColor={item.visible ? "#ffffff" : "#9ca3af"}
              style={{ marginLeft: 12 }}
              pointerEvents="auto"
            />
          </View>

          {/* Expanded Content - Keys in Row */}
          {isExpanded && (
            <View className="px-4 pb-4 border-t border-[#303032] pt-4" pointerEvents="box-none">
              <View className="flex-row items-center justify-between mb-3" pointerEvents="box-none">
                <Text className="text-white text-sm font-semibold">
                  Keys in this row
                </Text>
                {onAddKeyToRow && (
                  <TouchableOpacity
                    onPress={() => onAddKeyToRow(item.id)}
                    className="bg-green-600 rounded px-3 py-1.5"
                    pointerEvents="auto"
                  >
                    <Text className="text-white text-xs font-semibold">+ Add Key</Text>
                  </TouchableOpacity>
                )}
              </View>

              <DraggableKeyList
                keys={item.keys}
                onReorder={(keys) => onReorderKeys(item.id, keys)}
                onRemove={(keyId) => onRemoveKey(item.id, keyId)}
                emptyMessage="No keys in this row"
              />
            </View>
          )}
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <View style={{ overflow: 'visible' }}>
      <DraggableFlatList
        data={rows}
        onDragEnd={({ data }) => onReorder(data)}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        scrollEnabled={false}
        activationDistance={20}
        containerStyle={{ overflow: 'visible' }}
        dragItemOverflow={true}
      />
      <Text className="text-gray-400 text-xs mt-2 px-1">
        Long press the ☰ icon to reorder rows. Tap a row to expand and edit keys.
      </Text>
    </View>
  );
}
