import {View, Text, TouchableOpacity, Modal, Pressable} from "react-native";
import {Terminal, Server, FolderOpen, Key, Lock, MoreVertical, X} from "lucide-react-native";
import {SSHHost} from "@/types";
import {useTerminalSessions} from "@/app/contexts/TerminalSessionsContext";
import {useState} from "react";

interface HostProps {
    host: SSHHost;
    status: 'online' | 'offline' | 'unknown';
    isLast?: boolean;
}

function Host({host, status, isLast = false}: HostProps) {
    const {navigateToSessions} = useTerminalSessions();
    const [showContextMenu, setShowContextMenu] = useState(false);

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
                className={`py-3 px-4 ${!isLast ? 'border-b-2 border-dark-border' : ''}`}
                onPress={handleHostPress}
                activeOpacity={0.7}
            >
                <View className="flex flex-row items-center">
                    <View className={`${getStatusColor()} w-[15px] h-[15px] rounded-2xl mr-3`}/>
                    <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                            <Text className="text-white font-semibold text-base">{host.name}</Text>
                        </View>
                    </View>
                    <View className="ml-auto">
                        <MoreVertical size={16} color="#9CA3AF"/>
                    </View>
                </View>
                {host.tags && host.tags.length > 0 && (
                    <View className="flex-row flex-wrap gap-1 mt-2">
                        {host.tags.map((tag, index) => (
                            <View key={index}
                                  className="bg-dark-bg-button px-2 py-1 rounded-md border border-dark-border">
                                <Text className="text-white text-xs">{tag}</Text>
                            </View>
                        ))}
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
                <Pressable
                    className="flex-1 bg-black/50 justify-center items-center"
                    onPress={handleCloseContextMenu}
                >
                    <Pressable
                        className="bg-dark-bg-button rounded-lg border-2 border-dark-border p-4 min-w-[250px]"
                        onPress={(e) => e.stopPropagation()}
                    >
                        <Text className="text-white font-semibold text-lg mb-3 text-center">{host.name}</Text>

                        <View className="gap-2">
                            {host.enableTerminal && (
                                <TouchableOpacity
                                    onPress={handleTerminalPress}
                                    className="flex-row items-center gap-3 p-3 rounded-md bg-dark-bg-darker border border-dark-border"
                                    activeOpacity={0.7}
                                >
                                    <Terminal size={20} color="white"/>
                                    <Text className="text-white font-medium">SSH Terminal</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                className="flex-row items-center gap-3 p-3 rounded-md bg-dark-bg-darker border border-dark-border"
                                onPress={closeContextMenu}
                            >
                                <X size={20} color="white"/>
                                <Text className="text-white font-medium">Close</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    )
}

export default Host;