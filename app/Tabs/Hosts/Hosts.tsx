import {ScrollView, Text, TextInput, View, ActivityIndicator, Alert, TouchableOpacity, RefreshControl} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useState, useEffect} from 'react';
import {RefreshCw} from 'lucide-react-native';
import Folder from "@/app/Tabs/Hosts/Navigation/Folder";
import {getSSHHosts, getFoldersWithStats, getAllServerStatuses, initializeServerConfig, getCurrentServerUrl, ServerStatus} from "@/app/main-axios";
import {SSHHost} from "@/types";

interface FolderData {
    name: string;
    hosts: SSHHost[];
    stats?: {
        totalHosts: number;
        hostsByType: Array<{
            type: string;
            count: number;
        }>;
    };
}

export default function Hosts() {
    const insets = useSafeAreaInsets();
    const [folders, setFolders] = useState<FolderData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [serverStatuses, setServerStatuses] = useState<Record<number, ServerStatus>>({});

    const fetchData = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            
            // Initialize server config first
            await initializeServerConfig();
            
            // Check if server is configured
            const currentServerUrl = getCurrentServerUrl();
            console.log('Current server URL:', currentServerUrl);
            
            if (!currentServerUrl) {
                Alert.alert('No Server Configured', 'Please configure a server first in the settings.');
                return;
            }
            
            // Fetch hosts (required) and statuses (optional)
            const [hostsResult, statusesResult] = await Promise.allSettled([
                getSSHHosts(),
                getAllServerStatuses()
            ]);

            if (hostsResult.status !== 'fulfilled') {
                throw hostsResult.reason;
            }

            const hosts = hostsResult.value;
            const statuses = statusesResult.status === 'fulfilled' ? statusesResult.value : {};

            // Try to fetch folders data, but don't fail if it doesn't exist
            let foldersData = null;
            try {
                foldersData = await getFoldersWithStats();
            } catch (error) {
                console.warn('Folders API not available, using hosts data only:', error);
            }

            // Group hosts by folder
            const folderMap = new Map<string, FolderData>();
            
            // Add folders from API response if available
            if (foldersData && Array.isArray(foldersData)) {
                foldersData.forEach((folder: any) => {
                    folderMap.set(folder.name, {
                        name: folder.name,
                        hosts: [],
                        stats: folder.stats
                    });
                });
            }

            // Group hosts by folder
            hosts.forEach((host: SSHHost) => {
                const folderName = host.folder || 'No Folder';
                if (!folderMap.has(folderName)) {
                    folderMap.set(folderName, {
                        name: folderName,
                        hosts: [],
                        stats: { totalHosts: 0, hostsByType: [] }
                    });
                }
                folderMap.get(folderName)!.hosts.push(host);
            });

            // Convert to array and sort
            const foldersArray = Array.from(folderMap.values()).sort((a, b) => {
                if (a.name === 'No Folder') return 1;
                if (b.name === 'No Folder') return -1;
                return a.name.localeCompare(b.name);
            });

            setFolders(foldersArray);
            setServerStatuses(statuses);
        } catch (error) {
            console.error('Error fetching hosts data:', error);
            Alert.alert('Error', 'Failed to load hosts. Please check your connection and try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        fetchData(true);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredFolders = folders.map(folder => ({
        ...folder,
        hosts: folder.hosts.filter(host => 
            host.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            host.ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
            host.username.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(folder => folder.hosts.length > 0 || searchQuery === '');

    const getHostStatus = (hostId: number): 'online' | 'offline' | 'unknown' => {
        const status = serverStatuses[hostId];
        if (!status) return 'unknown';
        return status.status;
    };

    if (loading) {
        return (
            <View className="flex-1 bg-dark-bg px-6 justify-center items-center" style={{ paddingTop: insets.top + 24 }}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text className="text-white mt-4">Loading hosts...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-dark-bg px-6" style={{ paddingTop: insets.top + 20 }}>
            <View className="flex-1 gap-2">
                <View className="flex-row items-center justify-between">
                    <Text className="text-white font-bold text-3xl" style={{ lineHeight: 36, includeFontPadding: false }}>Hosts</Text>
                    <TouchableOpacity 
                        onPress={handleRefresh}
                        disabled={refreshing}
                        className="bg-dark-bg-button p-2 rounded-md border-2 border-dark-border"
                        activeOpacity={0.7}
                    >
                        <RefreshCw 
                            size={20} 
                            color="white"
                        />
                    </TouchableOpacity>
                </View>
                <TextInput
                    className="text-white w-full h-autobg-dark-bg-input rounded-md border-2 border-dark-border px-3 py-2"
                    placeholder="Search hosts..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <ScrollView 
                    className="flex-1 w-full"
                    contentContainerStyle={{ flexGrow: 1, width: '100%', gap: '5px' }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor="#ffffff"
                            colors={['#ffffff']}
                        />
                    }
                >
                    {filteredFolders.length === 0 ? (
                        <View className="flex-1 justify-center items-center py-8">
                            <Text className="text-gray-400 text-lg">
                                {searchQuery ? 'No hosts found matching your search' : 'No hosts configured'}
                            </Text>
                        </View>
                    ) : (
                        filteredFolders.map((folder, index) => (
                            <Folder
                                key={folder.name}
                                name={folder.name}
                                hosts={folder.hosts}
                                getHostStatus={getHostStatus}
                            />
                        ))
                    )}
                </ScrollView>
            </View>
        </View>
    );
}