import {ScrollView, View} from 'react-native';
import Folder from "@/app/Tabs/Hosts/Navigation/Folder";

export default function Hosts() {
    return (
        <View className="flex-1 bg-dark-bg px-6 pt-6">
            <View className="flex-1 mt-[25px] items-center gap-2">
                <ScrollView 
                    className="flex-1 w-full"
                    contentContainerStyle={{ flexGrow: 1, width: '100%', gap: '15px' }}
                    showsVerticalScrollIndicator={false}
                >
                    <Folder
                        name="Test"
                    />
                </ScrollView>
            </View>
        </View>
    );
}