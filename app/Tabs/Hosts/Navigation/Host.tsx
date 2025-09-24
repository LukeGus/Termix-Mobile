import {View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback, Animated, Easing} from "react-native";
import {Terminal, Server, FolderOpen, Key, Lock, MoreVertical, X} from "lucide-react-native";
import {SSHHost} from "@/types";
import {useTerminalSessions} from "@/app/contexts/TerminalSessionsContext";
import {useEffect, useRef, useState} from "react";

interface HostProps {
    host: SSHHost;
    status: 'online' | 'offline' | 'unknown';
    isLast?: boolean;
}

function Host({host, status, isLast = false}: HostProps) {
    const {navigateToSessions} = useTerminalSessions();
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [tagsContainerWidth, setTagsContainerWidth] = useState<number>(0);
    const statusLabel = status === 'online' ? 'UP' : status === 'offline' ? 'DOWN' : 'UNK';

    const getStatusColor = () => {
        switch (status) {
            case 'online':
                return 'bg-green-500';
            case 'offline':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getStatusPalette = () => {
        switch (status) {
            case 'online':
                return { main: '#22C55E', border: '#16A34A', glow: 'rgba(34,197,94,0.45)' };
            case 'offline':
                return { main: '#EF4444', border: '#DC2626', glow: 'rgba(239,68,68,0.45)' };
            default:
                return { main: '#9CA3AF', border: '#6B7280', glow: 'rgba(156,163,175,0.35)' };
        }
    };

    // Ping ripple animation for online status
    const rippleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (status === 'online') {
            rippleAnim.setValue(0);
            const loop = Animated.loop(
                Animated.timing(rippleAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                })
            );
            loop.start();
            return () => {
                rippleAnim.stopAnimation();
            };
        } else {
            rippleAnim.stopAnimation();
            rippleAnim.setValue(0);
        }
    }, [status, rippleAnim]);

    const handleHostPress = () => {
        setShowContextMenu(true);
    };

    const handleTerminalPress = () => {
        navigateToSessions(host);
        setShowContextMenu(false);
    };

    const handleCloseContextMenu = () => {
        setShowContextMenu(false);
    };

    const closeContextMenu = () => {
        setShowContextMenu(false);
    }

    return (
        <>
            <TouchableOpacity
                className="p-3 bg-dark-bg-darker rounded-md border-2 border-dark-border"
                onPress={handleTerminalPress}
                activeOpacity={0.7}
            >
                <View className="flex flex-row items-center">
                    {/* Avatar + status */}
                    <View className="mr-3" style={{ width: 44, height: 44 }}>
                        <View
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 9999,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#0B0F14',
                                borderWidth: 2,
                                borderColor: getStatusPalette().border,
                            }}
                        >
                            <Text className="text-white font-semibold" style={{ fontSize: 11 }}>{statusLabel}</Text>
                        </View>
                        {/* Status dot with ripple */}
                        <View style={{ position: 'absolute', right: -2, bottom: -2, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
                            {status === 'online' && (
                                <Animated.View
                                    pointerEvents="none"
                                    style={{
                                        position: 'absolute',
                                        width: 18,
                                        height: 18,
                                        borderRadius: 18,
                                        backgroundColor: getStatusPalette().glow,
                                        transform: [
                                            {
                                                scale: rippleAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [1, 2.2],
                                                }),
                                            },
                                        ],
                                        opacity: rippleAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.45, 0],
                                        }),
                                    }}
                                />
                            )}
                            <View style={{
                                width: 14,
                                height: 14,
                                borderRadius: 14,
                                backgroundColor: getStatusPalette().main,
                                borderWidth: 1,
                                borderColor: getStatusPalette().border,
                            }} />
                        </View>
                    </View>

                    {/* Main content */}
                    <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                            <Text className="text-white font-semibold" numberOfLines={1}>{host.name}</Text>
                        </View>
                        <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>
                            {host.ip}
                            {host.username ? `  •  ${host.username}` : ''}
                        </Text>
                    </View>
                    <TouchableOpacity className="bg-dark-bg rounded-md p-1 border-2 border-dark-border" onPress={handleHostPress}>
                        <MoreVertical size={16} color="#9CA3AF"/>
                    </TouchableOpacity>
                </View>

                {/* Tags */}
                {host.tags && host.tags.length > 0 && (
                    <View
                        className="mt-2"
                        onLayout={(e) => setTagsContainerWidth(e.nativeEvent.layout.width)}
                    >
                        <View className="flex-row items-center" style={{ flexWrap: 'nowrap', overflow: 'hidden' }}>
                            {(() => {
                                const chips: any[] = [];
                                if (!tagsContainerWidth) return null;
                                const horizontalGap = 6; // approx gap between chips
                                const basePadding = 16; // px for left+right padding
                                const borderAllowance = 6; // border + rounding allowance
                                const avgCharPx = 7; // estimated average char width for text-xs
                                let used = 0;
                                let shown = 0;
                                for (let i = 0; i < host.tags.length; i++) {
                                    const tag = String(host.tags[i]);
                                    const tagWidth = basePadding + borderAllowance + Math.ceil(tag.length * avgCharPx);
                                    const remainingCount = host.tags.length - (shown + 1);
                                    const moreLabel = remainingCount > 0 ? `+${remainingCount} more` : '';
                                    const moreWidth = remainingCount > 0 ? (basePadding + borderAllowance + Math.ceil(moreLabel.length * avgCharPx)) : 0;
                                    const sep = shown > 0 ? horizontalGap : 0;
                                    // Ensure room for current tag and potential +N chip
                                    if (used + sep + tagWidth + (remainingCount > 0 ? (horizontalGap + moreWidth) : 0) <= tagsContainerWidth) {
                                        used += sep + tagWidth;
                                        chips.push(
                                            <View key={`tag-${i}`} className="bg-dark-bg-button px-2 py-1 rounded-md border border-dark-border mr-[6px]">
                                                <Text className="text-white text-xs" numberOfLines={1}>{tag}</Text>
                                            </View>
                                        );
                                        shown += 1;
                                    } else {
                                        break;
                                    }
                                }
                                const hidden = host.tags.length - shown;
                                if (hidden > 0) {
                                    const label = `+${hidden} more`;
                                    chips.push(
                                        <View key="tag-more" className="bg-dark-bg-button px-2 py-1 rounded-md border border-dark-border">
                                            <Text className="text-gray-300 text-xs" numberOfLines={1}>{label}</Text>
                                        </View>
                                    );
                                } else if (chips.length > 0) {
                                    // remove trailing margin on last chip
                                    const last = chips.pop();
                                    if (last) {
                                        chips.push(
                                            <View key={(last as any).key} className="bg-dark-bg-button px-2 py-1 rounded-md border border-dark-border">
                                                {(last as any).props.children}
                                            </View>
                                        );
                                    }
                                }
                                return chips;
                            })()}
                        </View>
                    </View>
                )}
            </TouchableOpacity>

            {/* Context Menu Modal */}
            <Modal
                visible={showContextMenu}
                transparent={true}
                animationType="fade"
                onRequestClose={handleCloseContextMenu}
            >
                <TouchableWithoutFeedback onPress={handleCloseContextMenu}>
                    <View className="flex-1 bg-black/50 justify-end">
                        <TouchableWithoutFeedback onPress={() => {}}>
                            <View className="bg-dark-bg-button rounded-t-2xl border-t-2 border-x-2 border-dark-border px-4 pt-4 pb-6">

                                <View className="flex-row items-center justify-between mb-3">
                                    <View className="flex-row items-center">
                                        <View style={{ width: 10, height: 10, borderRadius: 10, backgroundColor: getStatusPalette().main, borderWidth: 1, borderColor: getStatusPalette().border }} />
                                        <Text className="text-white font-semibold text-base ml-2">{host.name}</Text>
                                    </View>
                                    <TouchableOpacity className="bg-dark-bg rounded-md p-1 border-2 border-dark-border" onPress={handleCloseContextMenu}>
                                        <X size={16} color="white" />
                                    </TouchableOpacity>
                                </View>

                                <View className="gap-2">
                                    {host.enableTerminal && (
                                        <TouchableOpacity
                                            onPress={handleTerminalPress}
                                            className="flex-row items-center gap-3 p-3 rounded-md bg-dark-bg-darker border border-dark-border"
                                            activeOpacity={0.7}
                                        >
                                            <Terminal size={20} color="white"/>
                                            <View className="flex-1">
                                                <Text className="text-white font-medium">Open SSH Terminal</Text>
                                                <Text className="text-gray-400 text-xs" numberOfLines={1}>{host.ip}{host.username ? `  •  ${host.username}` : ''}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        className="flex-row items-center gap-3 p-3 rounded-md bg-dark-bg-darker border border-dark-border"
                                        onPress={closeContextMenu}
                                        activeOpacity={0.7}
                                    >
                                        <X size={20} color="white"/>
                                        <Text className="text-white font-medium">Close</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    )
}

export default Host;