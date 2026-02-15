export const Config = {
    // Replace with your machine's IP address for physical device testing
    // or use 'http://10.0.2.2:8000' for Android Emulator
    // or 'http://localhost:8000' for iOS Simulator
    API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:8000/api/v1',
};
