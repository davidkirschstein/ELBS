import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Plane, Clock, Calendar, TrendingUp, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Menu } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import axios from 'axios';
import { format } from 'date-fns';

// Define FlightLog interface
interface FlightLog {
  id: number;
  flight_iata: string;
  flight_date: string;
  departure_iata: string;
  arrival_iata: string;
  departure_scheduled: string;
  arrival_scheduled: string;
  airline_iata: string;
  duration_hours: number;
}

export default function Dashboard() {
  const { colors } = useTheme();
  const { pilot, token } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentFlights, setRecentFlights] = useState<FlightLog[]>([]);
  const [upcomingFlights, setUpcomingFlights] = useState<FlightLog[]>([]);
  
  // Create display name with username priority
  const displayName = pilot?.username || 
                    `${pilot?.firstName || ''} ${pilot?.lastName || ''}`.trim() || 
                    'Pilot';

  const [stats, setStats] = useState({
    totalHours: 0,
    totalFlights: 0,
    recentHours: 0,
    upcomingCount: 0,
    onTimeRate: 95
  });

  // API Configuration
  const API_BASE_URL = 'http://192.168.36.138:5000';

  // Get authentication headers
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

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
    welcomeSection: {
      backgroundColor: colors.card,
      padding: 20,
      borderRadius: 12,
      marginBottom: 20,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    welcomeText: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    welcomeSubtext: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    authWarning: {
      backgroundColor: '#fee2e2',
      borderColor: '#fecaca',
      borderWidth: 1,
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    authWarningText: {
      flex: 1,
      color: '#dc2626',
      fontSize: 16,
      lineHeight: 22,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 20,
    },
    statCard: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 12,
      flex: 1,
      minWidth: '45%',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    statIconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primary,
      marginLeft: 8,
    },
    statLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    recentSection: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    flightItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    flightInfo: {
      flex: 1,
      marginLeft: 12,
    },
    flightNumber: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    flightRoute: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    flightTime: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 8,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
      color: '#ffffff',
    },
    alertsSection: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    alertItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    alertText: {
      fontSize: 14,
      color: colors.text,
      marginLeft: 8,
      flex: 1,
    },
    emptyState: {
      padding: 16,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  // Helper function to format time
  const formatTime = (datetimeStr: string) => {
    if (!datetimeStr) return '';
    
    try {
      if (datetimeStr.includes('T')) {
        return datetimeStr.split('T')[1].substring(0, 5);
      }
      
      if (datetimeStr.includes(' ')) {
        return datetimeStr.split(' ')[1].substring(0, 5);
      }
      
      return datetimeStr.substring(11, 16);
    } catch {
      return datetimeStr.length >= 16 ? datetimeStr.substring(11, 16) : datetimeStr;
    }
  };

  // Helper function to format date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  // Update the fetchFlightData function with authentication
  const fetchFlightData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/logs`, {
        headers: getAuthHeaders()
      });
      
      // Process flight data
      const allFlights = response.data;
      const now = new Date();
      
      // Get recent flights (last 30 days)
      const recent = allFlights.filter((flight: FlightLog) => {
        const flightDate = new Date(flight.flight_date);
        const diffTime = Math.abs(now.getTime() - flightDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
      });
      
      // Get upcoming flights
      const upcoming = allFlights.filter((flight: FlightLog) => {
        const flightDate = new Date(flight.flight_date);
        return flightDate > now;
      });
      
      // Convert duration_hours to numbers
      const parseFlightHours = (flight: FlightLog) => {
        if (typeof flight.duration_hours === 'string') {
          return parseFloat(flight.duration_hours) || 0;
        }
        return flight.duration_hours || 0;
      };
      
      // Calculate stats with proper number conversion
      const totalHours = allFlights.reduce((sum: number, flight: FlightLog) => 
        sum + parseFlightHours(flight), 0);
      
      const recentHours = recent.reduce((sum: number, flight: FlightLog) => 
        sum + parseFlightHours(flight), 0);
      
      setRecentFlights(recent.slice(0, 5));
      setUpcomingFlights(upcoming.slice(0, 5));
      
      setStats({
        totalHours,
        totalFlights: allFlights.length,
        recentHours,
        upcomingCount: upcoming.length,
        onTimeRate: 95
      });
    } catch (error) {
      console.error('Error fetching flight data:', error);
      if (error.response?.status === 401) {
        console.log('Authentication failed - user needs to log in again');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFlightData();
  }, [fetchFlightData]);

  // Show authentication warning if no token
  if (!token) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setSidebarVisible(true)}
            >
              <Menu size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Aviation Logbook</Text>
          </View>
        </View>
        
        <View style={styles.content}>
          <View style={styles.authWarning}>
            <Text style={styles.authWarningText}>
              Please log in to view your flight dashboard. Authentication is required to access your flight data and statistics.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setSidebarVisible(true)}
            >
              <Menu size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Aviation Logbook</Text>
          </View>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 10 }}>Loading flight data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setSidebarVisible(true)}
          >
            <Menu size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Aviation Logbook</Text>
        </View>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Welcome back, {displayName || 'Pilot'}!
          </Text>
          <Text style={styles.welcomeSubtext}>
            {`License: ${pilot?.licenseNumber || 'Not specified'} • Total Hours: ${
              typeof stats.totalHours === 'number' ? stats.totalHours.toFixed(1) : '0.0'
            }`}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Clock size={20} color={colors.primary} />
              <Text style={styles.statValue}>{stats.recentHours.toFixed(1)}</Text>
            </View>
            <Text style={styles.statLabel}>Recent Flight Hours</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Plane size={20} color={colors.success} />
              <Text style={styles.statValue}>{stats.totalFlights}</Text>
            </View>
            <Text style={styles.statLabel}>Total Flights</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Calendar size={20} color={colors.warning} />
              <Text style={styles.statValue}>{stats.upcomingCount}</Text>
            </View>
            <Text style={styles.statLabel}>Upcoming Flights</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <TrendingUp size={20} color={colors.accent} />
              <Text style={styles.statValue}>{stats.onTimeRate}%</Text>
            </View>
            <Text style={styles.statLabel}>On-Time Rate</Text>
          </View>
        </View>

        {/* Recent Flights */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Flights</Text>
          {recentFlights.length > 0 ? (
            recentFlights.map((flight) => (
              <View key={flight.id} style={styles.flightItem}>
                <Plane size={24} color={colors.primary} />
                <View style={styles.flightInfo}>
                  <Text style={styles.flightNumber}>
                    {flight.flight_iata || 'Unknown Flight'}
                  </Text>
                  <Text style={styles.flightRoute}>
                    {flight.departure_iata || '?'} → {flight.arrival_iata || '?'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.flightTime}>
                    {formatDate(flight.flight_date) || 'Unknown Date'}
                  </Text>
                </View>
                {/* Added status badge with Text wrapper */}
                <View style={[styles.statusBadge, { backgroundColor: colors.success }]}>
                  <Text style={styles.statusText}>Completed</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No recent flights</Text>
            </View>
          )}
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Upcoming Schedule</Text>
          
          {upcomingFlights.length > 0 ? (
            upcomingFlights.map((flight) => (
              <View key={flight.id} style={styles.flightItem}>
                <Plane size={24} color={colors.warning} />
                <View style={styles.flightInfo}>
                  <Text style={styles.flightNumber}>{flight.flight_iata}</Text>
                  <Text style={styles.flightRoute}>
                    {flight.departure_iata} → {flight.arrival_iata}
                  </Text>
                </View>
                <View>
                  <Text style={styles.flightTime}>
                    {formatDate(flight.flight_date)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No upcoming flights</Text>
            </View>
          )}
        </View>

        <View style={styles.alertsSection}>
          <Text style={styles.sectionTitle}>Flight Alerts</Text>
          <View style={styles.alertItem}>
            <CheckCircle size={16} color={colors.success} />
            <Text style={styles.alertText}>All certifications current</Text>
          </View>
          <View style={styles.alertItem}>
            <AlertTriangle size={16} color={colors.warning} />
            <Text style={styles.alertText}>Medical renewal due in 45 days</Text>
          </View>
          <View style={styles.alertItem}>
            <CheckCircle size={16} color={colors.success} />
            <Text style={styles.alertText}>Currency requirements met</Text>
          </View>
        </View>
      </ScrollView>

      <Sidebar 
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />
    </SafeAreaView>
  );
}