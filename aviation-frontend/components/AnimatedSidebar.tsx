import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  runOnJS 
} from 'react-native-reanimated';
import { Menu, X, Settings, Moon, Sun, Download, FileText, ChartBar as BarChart3, Shield, User, Plane } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.75;

interface SidebarProps {
  children: React.ReactNode;
}

export default function AnimatedSidebar({ children }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const translateX = useSharedValue(-SIDEBAR_WIDTH);

  const toggleSidebar = () => {
    if (isOpen) {
      translateX.value = withTiming(-SIDEBAR_WIDTH, { duration: 300 }, () => {
        runOnJS(setIsOpen)(false);
      });
    } else {
      setIsOpen(true);
      translateX.value = withTiming(0, { duration: 300 });
    }
  };

  const animatedSidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isOpen ? 0.5 : 0, { duration: 300 }),
    pointerEvents: isOpen ? 'auto' : 'none',
  }));

  const menuItems = [
    { icon: Plane, title: 'Dashboard', route: '/(tabs)' },
    { icon: FileText, title: 'Logbook', route: '/(tabs)/logbook' },
    { icon: BarChart3, title: 'Analytics', route: '/(tabs)/analytics' },
    { icon: Shield, title: 'Audit', route: '/(tabs)/audit' },
    { icon: User, title: 'Profile', route: '/(tabs)/profile' },
  ];

  const MenuItem = ({ icon: Icon, title, onPress, color = colors.text }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Icon color={color} size={24} />
      <Text style={[styles.menuItemText, { color }]}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <View style={styles.content}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <Menu color="white" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Aviation Logbook</Text>
        </View>
        {children}
      </View>

      {/* Overlay */}
      <Animated.View 
        style={[styles.overlay, animatedOverlayStyle]} 
        onTouchEnd={toggleSidebar}
      />

      {/* Sidebar */}
      <Animated.View 
        style={[
          styles.sidebar, 
          { backgroundColor: colors.surface },
          animatedSidebarStyle
        ]}
      >
        <View style={[styles.sidebarHeader, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.closeButton}>
            <X color="white" size={24} />
          </TouchableOpacity>
          <Text style={styles.sidebarTitle}>Menu</Text>
        </View>

        <View style={styles.sidebarContent}>
          <View style={styles.menuSection}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              Navigation
            </Text>
            {menuItems.map((item, index) => (
              <MenuItem
                key={index}
                icon={item.icon}
                title={item.title}
                onPress={() => {
                  router.push(item.route);
                  toggleSidebar();
                }}
              />
            ))}
          </View>

          <View style={styles.menuSection}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              Settings
            </Text>
            <MenuItem
              icon={isDarkMode ? Sun : Moon}
              title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
              onPress={toggleTheme}
            />
            <MenuItem
              icon={Settings}
              title="Settings"
              onPress={() => {
                toggleSidebar();
                // Navigate to settings
              }}
            />
            <MenuItem
              icon={Download}
              title="Export Data"
              onPress={() => {
                toggleSidebar();
                // Handle export
              }}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  menuButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: 'white',
    marginLeft: 15,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    zIndex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  closeButton: {
    padding: 5,
  },
  sidebarTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: 'white',
    marginLeft: 15,
  },
  sidebarContent: {
    flex: 1,
    padding: 20,
  },
  menuSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 15,
  },
});