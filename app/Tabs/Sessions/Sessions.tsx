import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Keyboard, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useTerminalSessions } from '@/app/contexts/TerminalSessionsContext';
import { useKeyboard } from '@/app/contexts/KeyboardContext';
import Terminal, { TerminalHandle } from '@/app/Tabs/Sessions/Terminal';
import TabBar from '@/app/Tabs/Sessions/Navigation/TabBar';
import { ArrowLeft } from 'lucide-react-native';

export default function Sessions() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { sessions, activeSessionId, setActiveSession, removeSession } = useTerminalSessions();
    const { keyboardHeight, isKeyboardVisible } = useKeyboard();
    const hiddenInputRef = useRef<TextInput>(null);
    const terminalRefs = useRef<Record<string, React.RefObject<TerminalHandle>>>({});

    // Ensure we have a ref for each session
    useEffect(() => {
        const map: Record<string, React.RefObject<TerminalHandle>> = { ...terminalRefs.current };
        sessions.forEach(s => {
            if (!map[s.id]) {
                map[s.id] = React.createRef<TerminalHandle>() as React.RefObject<TerminalHandle>;
            }
        });
        // Clean up refs for removed sessions
        Object.keys(map).forEach(id => {
            if (!sessions.find(s => s.id === id)) {
                delete map[id];
            }
        });
        terminalRefs.current = map;
    }, [sessions]);

    // Force keyboard to stay open when in sessions tab (only if there are sessions)
    useFocusEffect(
        React.useCallback(() => {
            // Only show keyboard if there are active sessions
            if (sessions.length > 0) {
                setTimeout(() => {
                    hiddenInputRef.current?.focus();
                }, 1000);
            }
            
            return () => {
                // Don't blur when leaving - keep keyboard persistent
            };
        }, [sessions.length])
    );

    // Keep keyboard open by refocusing when it gets dismissed - but with longer delays for tab interactions
    useEffect(() => {
        if (sessions.length > 0 && !isKeyboardVisible) {
            const timeoutId = setTimeout(() => {
                hiddenInputRef.current?.focus();
            }, 3000); // Much longer delay to allow tab interactions
            return () => clearTimeout(timeoutId);
        }
    }, [isKeyboardVisible, sessions.length]);

    const handleTabPress = (sessionId: string) => {
        setActiveSession(sessionId);
    };

    const handleTabClose = (sessionId: string) => {
        removeSession(sessionId);
    };

    const activeSession = sessions.find(session => session.id === activeSessionId);

    return (
        <View 
            className="flex-1 bg-dark-bg" 
            style={{ 
                paddingTop: insets.top,
            }}
        >

            <View 
                style={{
                    flex: 1,
                    marginBottom: keyboardHeight > 0 ? keyboardHeight + 60 : 60, // Space for keyboard + tab bar
                }}
            >
                {sessions.map((session) => (
                    <Terminal
                        key={session.id}
                        ref={terminalRefs.current[session.id]}
                        hostConfig={{
                            id: parseInt(session.host.id.toString()),
                            name: session.host.name,
                            ip: session.host.ip,
                            port: parseInt(session.host.port.toString()),
                            username: session.host.username,
                            authType: session.host.authType,
                            password: session.host.password,
                            key: session.host.key,
                            keyPassword: session.host.keyPassword,
                            keyType: session.host.keyType,
                            credentialId: session.host.credentialId ? parseInt(session.host.credentialId.toString()) : undefined,
                        }}
                        isVisible={session.id === activeSessionId}
                        title={session.title}
                        onClose={() => handleTabClose(session.id)}
                    />
                ))}
                
                {sessions.length === 0 && (
                    <View className="flex-1 justify-center items-center">
                        <Text className="text-white text-lg">
                            No active terminal sessions
                        </Text>
                        <Text className="text-white text-sm mt-2">
                            Connect to a host from the Hosts tab to start a terminal session
                        </Text>
                    </View>
                )}
            </View>
            
            <View
                style={{
                    position: 'absolute',
                    bottom: keyboardHeight > 0 ? keyboardHeight : 0,
                    left: 0,
                    right: 0,
                    height: 60,
                    zIndex: 1000, // Ensure tab bar is above everything
                }}
            >
                <TabBar
                    sessions={sessions}
                    activeSessionId={activeSessionId}
                    onTabPress={handleTabPress}
                    onTabClose={handleTabClose}
                    hiddenInputRef={hiddenInputRef}
                />
            </View>
            
            {/* Hidden TextInput to maintain keyboard focus - positioned to not interfere with tab bar */}
            {sessions.length > 0 && (
                <TextInput
                    ref={hiddenInputRef}
                    style={{
                        position: 'absolute',
                        top: -1000,
                        left: -1000,
                        width: 1,
                        height: 1,
                        opacity: 0,
                        color: 'transparent',
                        backgroundColor: 'transparent',
                        zIndex: -1,
                    }}
                    autoFocus={false}
                    showSoftInputOnFocus={true}
                    keyboardType="default"
                    returnKeyType="default"
                    blurOnSubmit={false}
                    editable={true}
                    autoCorrect={false}
                    autoCapitalize="none"
                    spellCheck={false}
                    textContentType="none"
                    multiline
                    onChangeText={(text) => {
                        // Send only the last entered character(s) to active terminal
                        const activeRef = activeSessionId ? terminalRefs.current[activeSessionId] : null;
                        if (activeRef && activeRef.current) {
                            // Diff approach: the TextInput may contain the full buffer; send increment
                            // For simplicity, send the last character typed
                            if (text && text.length > 0) {
                                const lastChar = text[text.length - 1];
                                activeRef.current.sendInput(lastChar);
                            }
                        }
                    }}
                    onKeyPress={({ nativeEvent }) => {
                        const key = nativeEvent.key;
                        const activeRef = activeSessionId ? terminalRefs.current[activeSessionId] : null;
                        if (activeRef && activeRef.current) {
                            if (key === 'Enter') {
                                activeRef.current.sendInput('\n');
                            } else if (key === 'Backspace') {
                                activeRef.current.sendInput('\b');
                            }
                        }
                    }}
                    onFocus={() => {
                        // Keep focus when focused
                    }}
                    onBlur={() => {
                        // Refocus after a short delay to allow tab interactions
                        setTimeout(() => {
                            if (sessions.length > 0) {
                                hiddenInputRef.current?.focus();
                            }
                        }, 100); // Very short delay to allow tab interactions
                    }}
                    onSubmitEditing={() => {
                        // Refocus to maintain keyboard
                        setTimeout(() => {
                            if (sessions.length > 0) {
                                hiddenInputRef.current?.focus();
                            }
                        }, 100);
                    }}
                />
            )}
            
        </View>
    );
}