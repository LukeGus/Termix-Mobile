import {View, Text, TouchableOpacity, Animated} from "react-native";
import Host from "@/app/Tabs/Hosts/Navigation/Host";
import {ChevronDown} from "lucide-react-native";
import {useState, useRef, useEffect} from "react";
import {SSHHost} from "@/types";

interface FolderProps {
    name: string;
    hosts: SSHHost[];
    getHostStatus: (hostId: number) => 'online' | 'offline' | 'unknown';
}

export default function Folder({name, hosts, getHostStatus}: FolderProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const rotateValue = useRef(new Animated.Value(0)).current;

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    useEffect(() => {
        Animated.timing(rotateValue, {
            toValue: isExpanded ? 0 : 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [isExpanded, rotateValue]);

    const rotate = rotateValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    return (
        <View className={`mb-2 w-full h-auto border-2 border-dark-border ${isExpanded ? 'rounded-md' : 'rounded-md'}`}>
            <View className={`bg-dark-bg-header ${isExpanded ? 'rounded-t-md border-b-2 border-dark-border' : 'rounded-md'}`}>
                <TouchableOpacity 
                    onPress={toggleExpanded} 
                    className="flex-row items-center justify-between p-2"
                    activeOpacity={0.7}
                >
                    <View className="flex-row items-center flex-1">
                        <Text className="text-lg font-bold text-white">{name}</Text>
                        <Text className="text-sm text-gray-400 ml-3">
                            {hosts.length} host{hosts.length !== 1 ? 's' : ''}
                        </Text>
                    </View>
                    <View className="bg-dark-bg-button rounded-md border-2 border-dark-border w-[28px] h-[28px] items-center justify-center ml-2">
                        <Animated.View style={{ transform: [{ rotate }] }}>
                            <ChevronDown
                                size={16}
                                color="white"
                            />
                        </Animated.View>
                    </View>
                </TouchableOpacity>
            </View>
            {isExpanded && (
                <View className="bg-dark-bg-darker rounded-b-md">
                    {hosts.length === 0 ? (
                        <View className="py-4 px-4">
                            <Text className="text-white text-center">No hosts in this folder</Text>
                        </View>
                    ) : (
                        hosts.map((host, index) => (
                            <Host
                                key={host.id}
                                host={host}
                                status={getHostStatus(host.id)}
                                isLast={index === hosts.length - 1}
                            />
                        ))
                    )}
                </View>
            )}
        </View>
    )
}