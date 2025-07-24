// app/(tabs)/_layout.tsx

import { Tabs } from 'expo-router';
import {
  Home as HomeIcon,
  BookOpen,
  Calendar,
  BarChart3,
  Plus,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Platform, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProtectedRoute from '@/components/ProtectedRoute'; // Add this import

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <ProtectedRoute> {/* Wrap entire layout with ProtectedRoute */}
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              borderTopWidth: 1,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              height: Platform.OS === 'ios' ? 85 : 70,
              paddingBottom: Platform.OS === 'ios' ? 25 : 10,
              paddingTop: 8,
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
            },
            tabBarActiveTintColor: colors.tabActive,
            tabBarInactiveTintColor: colors.tabInactive,
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '500',
              marginTop: 2,
            },
            tabBarIconStyle: {
              marginTop: 2,
            },
          }}
        >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ size, color }) => <HomeIcon  size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="logs"
          options={{
            title: 'Flight Logs',
            tabBarIcon: ({ size, color }) => <BookOpen size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="autofill"
          options={{
            title: '',
            tabBarIcon: ({ size }) => (
              <View style={[styles.plusIcon, { backgroundColor: colors.primary }]}>
                <Plus size={size + 6} color="#ffffff" />
              </View>
            ),
            tabBarLabelStyle: {
              display: 'none',
            },
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            title: 'Schedule',
            tabBarIcon: ({ size, color }) => <Calendar size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: 'Analytics',
            tabBarIcon: ({ size, color }) => <BarChart3 size={size} color={color} />,
          }}
        />
          </Tabs>
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  plusIcon: {
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});




// app/(tabs)/_layout.tsx

// import { Tabs } from 'expo-router';
// import {
//   Home as HomeIcon,
//   BookOpen,
//   Calendar,
//   BarChart3,
//   Plus,
// } from 'lucide-react-native';
// import { useTheme } from '@/contexts/ThemeContext';
// import { Platform, View, StyleSheet } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import ProtectedRoute from '@/components/ProtectedRoute';

// export default function TabLayout() {
//   const { colors } = useTheme();

//   return (
//     <ProtectedRoute>
//       <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
//         <Tabs
//           screenOptions={{
//             headerShown: false,
//             tabBarStyle: {
//               backgroundColor: colors.card,
//               borderTopColor: colors.border,
//               borderTopWidth: 1,
//               elevation: 8,
//               shadowColor: '#000',
//               shadowOffset: { width: 0, height: -2 },
//               shadowOpacity: 0.1,
//               shadowRadius: 8,
//               height: Platform.OS === 'ios' ? 85 : 70,
//               paddingBottom: Platform.OS === 'ios' ? 25 : 10,
//               paddingTop: 8,
//               position: 'absolute',
//               bottom: 0,
//               left: 0,
//               right: 0,
//             },
//             tabBarActiveTintColor: colors.tabActive,
//             tabBarInactiveTintColor: colors.tabInactive,
//             tabBarLabelStyle: {
//               fontSize: 11,
//               fontWeight: '500',
//               marginTop: 2,
//             },
//             tabBarIconStyle: {
//               marginTop: 2,
//             },
//           }}
//         >
//           <Tabs.Screen
//             name="index"
//             options={{
//               title: 'Dashboard',
//               tabBarIcon: ({ size, color }) => <HomeIcon  size={size} color={color} />,
//             }}
//           />
//           <Tabs.Screen
//             name="logs"
//             options={{
//               title: 'Flight Logs',
//               tabBarIcon: ({ size, color }) => <BookOpen size={size} color={color} />,
//             }}
//           />
//           <Tabs.Screen
//             name="autofill"
//             options={{
//               title: '',
//               tabBarIcon: ({ size }) => (
//                 <View style={[styles.plusIcon, { backgroundColor: colors.primary }]}>
//                   <Plus size={size + 6} color="#ffffff" />
//                 </View>
//               ),
//               tabBarLabelStyle: {
//                 display: 'none',
//               },
//             }}
//           />
//           <Tabs.Screen
//             name="schedule"
//             options={{
//               title: 'Schedule',
//               tabBarIcon: ({ size, color }) => <Calendar size={size} color={color} />,
//             }}
//           />
//           <Tabs.Screen
//             name="analytics"
//             options={{
//               title: 'Analytics',
//               tabBarIcon: ({ size, color }) => <BarChart3 size={size} color={color} />,
//             }}
//           />
//         </Tabs>
//       </SafeAreaView>
//     </ProtectedRoute>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   plusIcon: {
//     borderRadius: 30,
//     width: 60,
//     height: 60,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: -20,
//     elevation: 6,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//   },
// });