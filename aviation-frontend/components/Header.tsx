import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Plane, User, LogOut, Settings, Menu, X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { BlurView } from 'expo-blur'; // Install with: expo install expo-blur

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { pilot, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const displayName = pilot?.username || 
                    `${pilot?.firstName || ''} ${pilot?.lastName || ''}`.trim() || 
                    'Pilot';

  return (
    <View style={styles.headerContainer}>
      {/* Background with blur effect */}
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      
      <View style={styles.headerContent}>
        {/* Left side - Logo and title */}
        <View style={styles.leftContainer}>
          <View style={styles.logoContainer}>
            <Plane size={28} color="#fff" />
          </View>
          <View>
            <Text style={styles.title}>{title}</Text>
            {subtitle && (
              <Text style={styles.subtitle}>{subtitle}</Text>
            )}
          </View>
        </View>
        
        {/* Right side - User menu */}
        <View style={styles.userContainer}>
          <TouchableOpacity
            onPress={() => setShowUserMenu(!showUserMenu)}
            style={styles.userButton}
          >
            <View style={styles.userIcon}>
              <User size={20} color="#fff" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userRole}>{pilot?.licenseType} Pilot</Text>
            </View>
            <Menu size={16} color="#fff" />
          </TouchableOpacity>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              {/* Backdrop */}
              <TouchableOpacity 
                style={styles.menuBackdrop}
                onPress={() => setShowUserMenu(false)}
                activeOpacity={1}
              />
              
              {/* Menu */}
              <View style={styles.menuContainer}>
                {/* User Info */}
                <View style={styles.menuHeader}>
                  <Text style={styles.menuName}>{displayName}</Text>
                  <Text style={styles.menuEmail}>{pilot?.email}</Text>
                  <View style={styles.menuDetails}>
                    <Text style={styles.menuLabel}>License:</Text>
                    <Text style={styles.menuValue}>
                      {pilot?.licenseType} {pilot?.licenseNumber && `#${pilot.licenseNumber}`}
                    </Text>
                  </View>
                  {pilot?.totalHours !== undefined && (
                    <View style={styles.menuDetails}>
                      <Text style={styles.menuLabel}>Total Hours:</Text>
                      <Text style={styles.menuValue}>
                        {pilot.totalHours.toFixed(1)}h
                      </Text>
                    </View>
                  )}
                </View>

                {/* Menu Items */}
                <View style={styles.menuItems}>
                  <TouchableOpacity style={styles.menuItem}>
                    <Settings size={16} color="#6b7280" />
                    <Text style={styles.menuItemText}>Account Settings</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.menuItem}>
                    <User size={16} color="#6b7280" />
                    <Text style={styles.menuItemText}>Profile</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.menuDivider} />
                  
                  <TouchableOpacity
                    onPress={handleLogout}
                    style={[styles.menuItem, styles.logoutItem]}
                  >
                    <LogOut size={16} color="#ef4444" />
                    <Text style={[styles.menuItemText, styles.logoutText]}>Sign Out</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#3b82f6',
    overflow: 'hidden',
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    color: '#dbeafe',
    fontSize: 14,
  },
  userContainer: {
    position: 'relative',
  },
  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    gap: 12,
  },
  userIcon: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    display: 'none', // Hidden by default
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  userRole: {
    fontSize: 12,
    color: '#dbeafe',
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  menuContainer: {
    position: 'absolute',
    right: 0,
    top: '100%',
    marginTop: 8,
    width: 256,
    backgroundColor: '#fff',
    borderRadius: 16,
    zIndex: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  menuHeader: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  menuEmail: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  menuDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  menuLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  menuValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3b82f6',
  },
  menuItems: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 14,
    color: '#374151',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  logoutItem: {
    // No additional styles needed
  },
  logoutText: {
    color: '#ef4444',
  },
});

export default Header;