import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { PatchProvider } from '@/context/PatchContext';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <PatchProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: Colors.primary },
            headerTintColor: Colors.textInverse,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: Colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="patch/add"
            options={{ title: 'New Patch', presentation: 'modal' }}
          />
          <Stack.Screen
            name="patch/[id]"
            options={{ title: 'Patch Details' }}
          />
          <Stack.Screen
            name="log/[patchId]"
            options={{ title: "Today's Log", presentation: 'modal' }}
          />
        </Stack>
      </PatchProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
