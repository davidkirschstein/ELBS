import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { 
  X, Home, BookOpen, Calendar, BarChart3, History, 
  Settings, Database, Plane, LogOut 
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';

interface MenuItem {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  route: string;
}

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
}

const MENU_ITEMS: MenuItem[] = [
  { icon: Home, label: 'Dashboard', route: '/' },
  { icon: BookOpen, label: 'Flight Logs', route: '/logs' },
  { icon: Calendar, label: 'Scheduling', route: '/schedule' },
  { icon: BarChart3, label: 'Analytics', route: '/analytics' },
  { icon: History, label: 'Audit Logs', route: '/audit' },
  // { icon: Database, label: 'Backup & Recovery', route: '/backup' },
  { icon: Settings, label: 'Settings', route: '/settings' },
];

export default function Sidebar({ visible, onClose }: SidebarProps) {
  const { colors } = useTheme();
  const { logout } = useUser();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleNavigation = (route: string) => {
    router.push(route);
    onClose();
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      router.replace('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoggingOut(false);
      onClose();
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
    },
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      width: 280,
      backgroundColor: colors.surface,
      borderRightWidth: 1,
      borderRightColor: colors.border,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 2, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      zIndex: 1001,
    },
    header: {
  flexDirection: 'row',
  alignItems: 'flex-end',  // Changed from 'center' to 'flex-end'
  justifyContent: 'space-between',
  paddingHorizontal: 16,
  paddingTop: Platform.select({ ios: 16, android: 24 }),
  paddingBottom: 16,
  backgroundColor: colors.primary,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
  height: 103,  // Added fixed height to ensure consistent bottom alignment
},
headerContent: {
  flexDirection: 'row',
  alignItems: 'flex-end',  // Align items to bottom
  paddingBottom: 2,  // Add padding at bottom
},
headerTitle: {
  fontSize: 18,
  fontWeight: '600',
  color: '#ffffff',
  marginLeft: 12,
  paddingBottom: 0.5,  // Added padding for better vertical alignment
  paddingTop: 5,
},
closeButton: {
  padding: 3,
  paddingBottom: 2,  // Align close button with text
},
    menuList: {
      flex: 1,
      paddingVertical: 8,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginHorizontal: 8,
      marginVertical: 4,
      borderRadius: 8,
    },
    menuLabel: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
      marginLeft: 12,
    },
    footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    footerText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 12,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginHorizontal: 8,
      marginVertical: 12,
      borderRadius: 8,
      backgroundColor: `${colors.primary}20`,
      opacity: loggingOut ? 0.5 : 1,
    },
    logoutLabel: {
      fontSize: 16,
      color: colors.secondary || '#e53935',
      fontWeight: '500',
      marginLeft: 12,
    },
  }), [colors, loggingOut]);

  if (!visible) return null;

  return (
    <>
      <Pressable 
        style={styles.overlay} 
        onPress={onClose} 
      />
      
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Plane size={24} color="#ffffff" />
            <Text style={styles.headerTitle}>Aviation Logbook</Text>
          </View>
          
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={20} color="#ffffff" />
          </Pressable>
        </View>

        <ScrollView style={styles.menuList}>
          {MENU_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <Pressable
                key={`menu-${index}`}
                style={styles.menuItem}
                onPress={() => handleNavigation(item.route)}
              >
                <Icon size={20} color={colors.primary} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </Pressable>
            );
          })}

          <Pressable
            onPress={handleLogout}
            disabled={loggingOut}
            style={styles.logoutButton}
          >
            <LogOut size={20} color={colors.textSecondary || '#e53935'} />
            <Text style={styles.logoutLabel}>Logout</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Aviation Logbook v1.0.0</Text>
        </View>
      </View>
    </>
  );
}