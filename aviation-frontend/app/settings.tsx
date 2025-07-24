import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import { User, Bell, Shield, Database, Download, Upload, Moon, Plane, Mail, Phone, CreditCard as Edit3, Menu } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import Sidebar from '@/components/Sidebar';
import DataTable from '@/components/DataTable';
import { mockAuditLogs } from '@/data/mockData';

export default function Settings() {
  const { colors, theme, toggleTheme, isDark } = useTheme();
  const { user } = useUser();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingBottom: Platform.OS === 'ios' ? 85 : 70,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingTop: 50,
      backgroundColor: colors.primary,
      marginBottom: 20,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: '#ffffff',
      marginLeft: 12,
    },
    menuButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    sectionTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitleText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    profileInfo: {
      flex: 1,
      marginLeft: 12,
    },
    profileName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    profileDetail: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    editButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: colors.primary + '20',
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingInfo: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    settingDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    themeSelector: {
      flexDirection: 'row',
      gap: 8,
    },
    themeButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    themeButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    themeButtonText: {
      fontSize: 14,
      color: colors.text,
    },
    themeButtonTextActive: {
      color: '#ffffff',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    dangerButton: {
      backgroundColor: colors.error,
    },
    buttonText: {
      color: '#ffffff',
      fontWeight: '600',
      marginLeft: 8,
      fontSize: 14,
    },
    auditSection: {
      marginTop: 20,
    },
    auditTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
  });

  const auditColumns = [
    {
      key: 'timestamp',
      title: 'Timestamp',
      width: 150,
      sortable: true,
    },
    {
      key: 'action',
      title: 'Action',
      width: 150,
      sortable: true,
    },
    {
      key: 'details',
      title: 'Details',
      width: 200,
      sortable: false,
    },
    {
      key: 'ipAddress',
      title: 'IP Address',
      width: 120,
      sortable: false,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings & Profile</Text>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setSidebarVisible(true)}
        >
          <Menu size={20} color={colors.primary} />
        </TouchableOpacity>
      </View> */}

      <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <TouchableOpacity 
                    style={styles.menuButton}
                    onPress={() => setSidebarVisible(true)}
                  >
                    <Menu size={24} color="#ffffff" />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>Settings & Profile</Text>
                </View>
              </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <User size={24} color={colors.primary} />
            <Text style={styles.sectionTitleText}>Profile Information</Text>
          </View>
          
          <View style={styles.profileRow}>
            <Plane size={20} color={colors.textSecondary} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileDetail}>{user?.certificationType}</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Edit3 size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileRow}>
            <Mail size={20} color={colors.textSecondary} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.email}</Text>
              <Text style={styles.profileDetail}>Primary email</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Edit3 size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileRow}>
            <Shield size={20} color={colors.textSecondary} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.licenseNumber}</Text>
              <Text style={styles.profileDetail}>License Number</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Edit3 size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Bell size={24} color={colors.primary} />
            <Text style={styles.sectionTitleText}>Preferences</Text>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive alerts for flight schedules and updates
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={notifications ? colors.primary : colors.textSecondary}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Theme</Text>
              <Text style={styles.settingDescription}>
                Choose your preferred app appearance
              </Text>
            </View>
            <View style={styles.themeSelector}>
              {['light', 'dark', 'system'].map((themeOption) => (
                <TouchableOpacity
                  key={themeOption}
                  style={[
                    styles.themeButton,
                    theme === themeOption && styles.themeButtonActive
                  ]}
                  onPress={() => toggleTheme(themeOption as any)}
                >
                  <Text style={[
                    styles.themeButtonText,
                    theme === themeOption && styles.themeButtonTextActive
                  ]}>
                    {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Database size={24} color={colors.primary} />
            <Text style={styles.sectionTitleText}>Data Management</Text>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Automatic Backup</Text>
              <Text style={styles.settingDescription}>
                Automatically backup your flight data daily
              </Text>
            </View>
            <Switch
              value={autoBackup}
              onValueChange={setAutoBackup}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={autoBackup ? colors.primary : colors.textSecondary}
            />
          </View>
          
          <TouchableOpacity style={styles.actionButton}>
            <Download size={20} color="#ffffff" />
            <Text style={styles.buttonText}>Export Flight Data</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Upload size={20} color="#ffffff" />
            <Text style={styles.buttonText}>Import Flight Data</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Database size={20} color="#ffffff" />
            <Text style={styles.buttonText}>Create Backup</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.dangerButton]}>
            <Database size={20} color="#ffffff" />
            <Text style={styles.buttonText}>Restore from Backup</Text>
          </TouchableOpacity>
        </View>

        {/* Audit Logs Section */}
        <View style={styles.auditSection}>
          <Text style={styles.auditTitle}>Recent Activity Audit</Text>
          <DataTable
            columns={auditColumns}
            data={mockAuditLogs.slice(0, 5)}
          />
        </View>
      </ScrollView>

      <Sidebar 
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />
    </SafeAreaView>
  );
}