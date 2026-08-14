import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { AuthProvider } from '@/context/AuthContext';
import { ConsentProvider } from '@/context/ConsentContext';
import { PatchProvider } from '@/context/PatchContext';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
        <ConsentProvider>
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
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="consent"
                options={{ title: 'Research Data Sharing', presentation: 'modal' }}
              />
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
              <Stack.Screen
                name="community/[groupId]"
                options={{ title: 'Group' }}
              />
              <Stack.Screen
                name="community/post/[postId]"
                options={{ title: 'Post' }}
              />
              <Stack.Screen
                name="community/new"
                options={{ title: 'New Post', presentation: 'modal' }}
              />
              <Stack.Screen
                name="community/new-group"
                options={{ title: 'New Group', presentation: 'modal' }}
              />
            </Stack>
          </PatchProvider>
        </ConsentProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
