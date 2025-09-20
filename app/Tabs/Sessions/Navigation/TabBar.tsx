import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { TerminalSession } from '@/app/contexts/TerminalSessionsContext';

interface TabBarProps {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  onTabPress: (sessionId: string) => void;
  onTabClose: (sessionId: string) => void;
}

export default function TabBar({ sessions, activeSessionId, onTabPress, onTabClose }: TabBarProps) {
  const insets = useSafeAreaInsets();
  
  if (sessions.length === 0) {
    return null;
  }

  return (
    <View 
      style={{
        backgroundColor: '#0e0e10',
        borderTopWidth: 1.5,
        borderTopColor: '#303032',
        paddingBottom: insets.bottom,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingHorizontal: 12, 
          paddingVertical: 8,
          gap: 8
        }}
        className="flex-row"
      >
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          
          return (
            <TouchableOpacity
              key={session.id}
              onPress={() => onTabPress(session.id)}
              className={`flex-row items-center rounded-md border-2 border-dark-border mr-1 min-w-[140px] max-w-[200px] ${
                isActive 
                  ? 'bg-dark-bg-button' 
                  : 'bg-dark-bg-input'
              }`}
              activeOpacity={0.7}
              style={{
                shadowColor: isActive ? '#000' : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isActive ? 0.1 : 0,
                shadowRadius: 4,
                elevation: isActive ? 2 : 0,
              }}
            >
              <Text 
                className={`text-sm font-medium flex-1 px-4 py-3 ${
                  isActive ? 'text-white' : 'text-gray-400'
                }`}
                numberOfLines={1}
              >
                {session.title}
              </Text>
              
              <View className="border-l-2 border-dark-border h-full">
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onTabClose(session.id);
                  }}
                  className="px-3 py-3 h-full justify-center items-center"
                  activeOpacity={0.7}
                >
                  <X 
                    size={14} 
                    color={isActive ? '#ffffff' : '#9CA3AF'} 
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}