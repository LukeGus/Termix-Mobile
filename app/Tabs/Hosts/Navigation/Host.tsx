import {View, Text, TouchableOpacity} from "react-native";
import {Terminal, Server, FolderOpen, Key, Lock} from "lucide-react-native";
import {SSHHost} from "@/types";
import {useTerminalSessions} from "@/app/contexts/TerminalSessionsContext";

interface HostProps {
    host: SSHHost;
    status: 'online' | 'offline' | 'unknown';
    isLast?: boolean;
}

function Host({host, status, isLast = false}: HostProps) {
    const { navigateToSessions } = useTerminalSessions();

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
    const getAuthIcon = () => {
        switch (host.authType) {
            case 'password':
                return <Lock size={12} color="white" />;
            case 'key':
                return <Key size={12} color="white" />;
            case 'credential':
                return <Server size={12} color="white" />;
            default:
                return <Lock size={12} color="white" />;
        }
    };

    const handleTerminalPress = () => {
        console.log('Connect to terminal for host:', host.name);
        navigateToSessions(host);
    };

    return (
        <View className={`py-3 px-4 ${!isLast ? 'border-b-2 border-dark-border' : ''}`}>
            <View className="flex flex-row items-center">
                <View className={`${getStatusColor()} w-[15px] h-[15px] rounded-2xl mr-3`}/>
                <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                        <Text className="text-white font-semibold text-base">{host.name}</Text>
                    </View>
                </View>
                <View className="ml-auto flex-row gap-2">
                    {host.enableTerminal && (
                        <TouchableOpacity 
                            onPress={handleTerminalPress}
                            className="bg-dark-bg-button p-2 rounded-md border-2 border-dark-border"
                        >
                            <Terminal size={16} color="white" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            {host.tags && host.tags.length > 0 && (
                <View className="flex-row flex-wrap gap-1 mt-2">
                    {host.tags.map((tag, index) => (
                        <View key={index} className="bg-dark-bg-button px-2 py-1 rounded-md border border-dark-border">
                            <Text className="text-white text-xs">{tag}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    )
}

export default Host;