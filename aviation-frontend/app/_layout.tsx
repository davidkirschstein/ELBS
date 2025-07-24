// app/_layout.tsx
import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen'; // Changed import
import { View } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { UserProvider } from '@/contexts/UserContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import CustomSplashScreen from '@/components/splashScreen';

// Keep splash screen visible while we prepare
SplashScreen.preventAutoHideAsync().catch(console.warn);

export default function RootLayout() {
  useFrameworkReady();
  const [appReady, setAppReady] = useState(false);
  const [splashComplete, setSplashComplete] = useState(false);
  
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide native splash screen
      SplashScreen.hideAsync().catch(console.warn);
      setAppReady(true);
    }
  }, [fontsLoaded, fontError]);

  if (!appReady) {
    return <View style={{ flex: 1, backgroundColor: '#0d47a1' }} />;
  }

  return (
    <ThemeProvider>
      <UserProvider>
        <AuthProvider>
          {!splashComplete ? (
            <CustomSplashScreen onAnimationComplete={() => setSplashComplete(true)} />
          ) : (
            <>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style="auto" />
            </>
          )}
        </AuthProvider>
      </UserProvider>
    </ThemeProvider>
  );
}



// import { useEffect } from 'react';
// import { StatusBar } from 'expo-status-bar';
// import { SplashScreen, Stack } from 'expo-router';
// import { SafeAreaProvider } from 'react-native-safe-area-context';

// import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';

// import { useFrameworkReady } from '@/hooks/useFrameworkReady';
// import { ThemeProvider } from '@/contexts/ThemeContext';
// import { UserProvider } from '@/contexts/UserContext';
// import { AuthProvider } from '@/contexts/AuthContext';

// // Prevent splash screen from hiding automatically
// SplashScreen.preventAutoHideAsync();

// export default function RootLayout() {
//   useFrameworkReady();

//   const [fontsLoaded, fontError] = useFonts({
//     'Inter-Regular': Inter_400Regular,
//     'Inter-Medium': Inter_500Medium,
//     'Inter-SemiBold': Inter_600SemiBold,
//   });

//   useEffect(() => {
//     if (fontsLoaded || fontError) {
//       SplashScreen.hideAsync();
//     }
//   }, [fontsLoaded, fontError]);

//   if (!fontsLoaded && !fontError) return null;

//   return (
//     <SafeAreaProvider>
//       <ThemeProvider>
//         <UserProvider>
//           <AuthProvider>
//             <Stack screenOptions={{ headerShown: false }}>
//               <Stack.Screen name="(tabs)" />
//               <Stack.Screen name="+not-found" />
//             </Stack>
//             <StatusBar style="auto" />
//           </AuthProvider>
//         </UserProvider>
//       </ThemeProvider>
//     </SafeAreaProvider>
//   );
// }
