import React from 'react';
import { Tabs } from 'expo-router';

/**
 * Tab layout — hides the default bottom tab bar.
 * Navigation is handled by a custom top-bar component inside each screen,
 * matching the mockup's Day / Feed / Stats switcher near the header.
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
      <Tabs.Screen name="stats" />
    </Tabs>
  );
}
