import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Mic, Camera } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { View } from 'react-native';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#f97316' : '#0f172a';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#f97316', // Brand Orange
        tabBarInactiveTintColor: '#64748b',
        headerShown: true,
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? '#0f172a' : '#ffffff',
        },
        headerTitleStyle: {
          color: colorScheme === 'dark' ? '#ffffff' : '#0f172a',
          fontFamily: 'Outfit-Bold', // Assuming font logic later, or default system font
        },
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#0f172a' : '#ffffff',
          borderTopColor: colorScheme === 'dark' ? '#1e293b' : '#e2e8f0',
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="voice"
        options={{
          title: 'Voice Notes',
          tabBarIcon: ({ color }) => <Mic size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Smart Scan',
          tabBarIcon: ({ color }) => <Camera size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
