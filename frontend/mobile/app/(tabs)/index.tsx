
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, Camera, FileText, Bell, MessageSquare } from 'lucide-react-native';
import { Link, useRouter } from 'expo-router';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
      <ScrollView className="px-4 py-6">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">Welcome back,</Text>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">Field Manager</Text>
          </View>
          <TouchableOpacity className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm">
            <Bell size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</Text>
        <View className="flex-row gap-4 mb-4">
          <TouchableOpacity
            className="flex-1 bg-orange-500 rounded-xl p-4 items-center shadow-md active:opacity-90"
            onPress={() => router.push('/voice')}
          >
            <View className="bg-white/20 p-3 rounded-full mb-2">
              <Mic size={24} color="white" />
            </View>
            <Text className="text-white font-semibold">Record Note</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-slate-800 rounded-xl p-4 items-center shadow-md active:opacity-90"
            onPress={() => router.push('/camera')}
          >
            <View className="bg-white/10 p-3 rounded-full mb-2">
              <Camera size={24} color="white" />
            </View>
            <Text className="text-white font-semibold">Scan Invoice</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-4 mb-8">
          <TouchableOpacity
            className="flex-1 bg-green-600 rounded-xl p-4 items-center shadow-md active:opacity-90"
            onPress={() => router.push('/coordination')}
          >
            <View className="bg-white/20 p-3 rounded-full mb-2">
              <MessageSquare size={24} color="white" />
            </View>
            <Text className="text-white font-semibold">Contractor Msg</Text>
          </TouchableOpacity>
          <View className="flex-1" />
        </View>

        {/* Recent Activity */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</Text>
          <Text className="text-orange-600 text-sm font-medium">View All</Text>
        </View>

        <View className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <View key={i} className="flex-row items-center justify-between border-b border-gray-100 dark:border-slate-700 last:border-0 pb-4 last:pb-0">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-full items-center justify-center">
                  <FileText size={18} className="text-blue-600 dark:text-blue-400" color="#2563eb" />
                </View>
                <View>
                  <Text className="font-semibold text-gray-900 dark:text-white">Invoice #INV-2024-{100 + i}</Text>
                  <Text className="text-xs text-gray-500">Processed via Magic Extractor</Text>
                </View>
              </View>
              <Text className="text-xs text-gray-400">2h ago</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
