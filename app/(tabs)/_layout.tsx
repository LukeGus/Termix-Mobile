import {Tabs, usePathname} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useKeyboard} from '../contexts/KeyboardContext';
import {useTerminalSessions} from '../contexts/TerminalSessionsContext';

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    const { keyboardHeight, isKeyboardVisible } = useKeyboard();
    const { sessions } = useTerminalSessions();
    const pathname = usePathname();
    
    // Hide main tab bar when in sessions tab AND there are active sessions
    const isSessionsTab = pathname === '/sessions';
    const hasActiveSessions = sessions.length > 0;
    const shouldHideMainTabBar = isSessionsTab && hasActiveSessions;
    
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#e6e6e6',
                tabBarInactiveTintColor: '#5a5a5d',
                tabBarStyle: shouldHideMainTabBar ? { display: 'none' } : {
                    backgroundColor: '#0e0e10',
                    borderTopWidth: 1.5,
                    borderTopColor: '#303032',
                    paddingBottom: insets.bottom,
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
