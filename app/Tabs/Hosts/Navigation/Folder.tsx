import {View, Text, TouchableOpacity, Animated} from "react-native";
import Host from "@/app/Tabs/Hosts/Navigation/Host";
import {ChevronDown} from "lucide-react-native";
import {useState, useRef, useEffect} from "react";

interface FolderProps {
    name: string;
}

export default function Folder({name}: FolderProps) {
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
        <View className={`w-full h-auto border-2 border-dark-border ${isExpanded ? 'rounded-md' : 'rounded-md'}`}>
            <View className={`bg-dark-bg-darker justify-center ${isExpanded ? 'rounded-t-md border-b-2 border-dark-border' : 'rounded-md'}`}>
                <Text className="text-lg font-bold text-white p-2 pr-12">{name}</Text>
                <TouchableOpacity 
                    onPress={toggleExpanded} 
                    className="bg-dark-bg rounded-md border-2 border-dark-border w-[28px] h-[28px] items-center justify-center absolute right-4 top-1/2 -translate-y-1/2 flex-shrink-0"
                >
                    <Animated.View style={{ transform: [{ rotate }] }}>
                        <ChevronDown
                            size={16}
                            color="white"
                        />
                    </Animated.View>
                </TouchableOpacity>
            </View>
            {isExpanded && (
                <View className="bg-dark-bg-darkest justify-center rounded-b-md text-white p-2">
                    <Host/>
                </View>
            )}
        </View>
    )
}