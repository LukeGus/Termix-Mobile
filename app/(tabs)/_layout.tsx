import {Tabs} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useKeyboard} from '../contexts/KeyboardContext';

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    const { keyboardHeight, isKeyboardVisible } = useKeyboard();
    
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#e6e6e6',
                tabBarInactiveTintColor: '#5a5a5d',
                tabBarStyle: {
                    backgroundColor: '#0e0e10',
                    borderTopWidth: 1.5,
                    borderTopColor: '#303032',
                    paddingBottom: isKeyboardVisible ? 0 : insets.bottom,
                    marginBottom: isKeyboardVisible ? keyboardHeight : 0,
                },
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="hosts"
                options={{
                    title: 'Hosts',
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name="server" size={size} color={color}/>
                    ),
                }}
            />
            <Tabs.Screen
                name="sessions"
                options={{
                    title: 'Sessions',
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name="desktop" size={size} color={color}/>
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name="settings" size={size} color={color}/>
                    ),
                }}
            />
        </Tabs>
    );
}
