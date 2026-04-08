import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '@/constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  name,
  focused,
  color,
}: {
  name: IconName;
  focused: boolean;
  color: string;
}) {
  return <Ionicons name={focused ? name : (`${name}-outline` as IconName)} size={24} color={color} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.borderLight,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: Typography.xs,
          fontWeight: Typography.medium,
        },
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.textInverse,
        headerTitleStyle: { fontWeight: '700', fontSize: Typography.lg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="home" focused={focused} color={color} />
          ),
          headerTitle: "it's Spotlit",
        }}
      />
      <Tabs.Screen
        name="patches"
        options={{
          title: 'My Patches',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="body" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="timelapse"
        options={{
          title: 'Timelapse',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="film" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="settings" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
