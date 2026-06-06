import React from 'react';
import { Tabs } from 'expo-router';

/**
 * Tab layout — hides the default bottom tab bar.
 * Navigation is handled within each screen.
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="feed" />
    </Tabs>
  );
}
