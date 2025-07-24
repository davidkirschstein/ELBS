import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { Menu } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { format } from 'date-fns';
import DataTable from '@/components/DataTable';
import Sidebar from '@/components/Sidebar';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LogsScreen() {
  // ========================================================================
  // HOOKS & CONTEXT
  // ========================================================================
  const { colors } = useTheme();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  const [logs, setLogs] = useState<FlightLog[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortKey, setSortKey] = useState<keyof FlightLog>('flight_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // ========================================================================
  // CONSTANTS & CONFIGURATION
  // ========================================================================
  const API_BASE_URL = 'http://192.168.36.138:5000';

  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================
  const getAuthHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }), [token]);

  const formatTime = useCallback((datetimeStr: string): string => {
    if (!datetimeStr) return '';
    try {
      if (datetimeStr.startsWith('2000-01-01')) {
        return datetimeStr.substring(11, 16);
      }
      if (datetimeStr.includes('T')) {
        return datetimeStr.split('T')[1].substring(0, 5);
      }
      const date = new Date(datetimeStr);
      if (!isNaN(date.getTime())) {
        return format(date, 'HH:mm');
      }
      return datetimeStr.length >= 16 ? datetimeStr.substring(11, 16) : datetimeStr;
    } catch {
      return datetimeStr.length >= 16 ? datetimeStr.substring(11, 16) : datetimeStr;
    }
  }, []);

  const formatDate = useCallback((dateStr: string): string => {
    try {
      const date = dateStr.includes('T')
        ? new Date(dateStr.split('T')[0])
        : new Date(dateStr);
      return format(date, 'MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  }, []);

  // ========================================================================
  // DATA MANAGEMENT
  // ========================================================================
  const fetchLogs = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setRefreshing(true);
      const response = await axios.get(
        `${API_BASE_URL}/logs`,
        { headers: getAuthHeaders() }
      );

      console.log('Fetched logs:', response.data);

      const logsWithNumbers = response.data.map((log: any) => ({
        ...log,
        duration_hours: typeof log.duration_hours === 'string'
          ? parseFloat(log.duration_hours)
          : log.duration_hours
      }));

      setLogs(logsWithNumbers);
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      
      let errorMessage = 'Failed to fetch flight logs';
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, getAuthHeaders]);

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================
  const handleSort = useCallback((key: string, direction: 'asc' | 'desc') => {
    setSortKey(key as keyof FlightLog);
    setSortDirection(direction);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ========================================================================
  // COMPUTED VALUES
  // ========================================================================
  const sortedLogs = useCallback(() => {
    return [...logs].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      if (aValue === bValue) return 0;
      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [logs, sortKey, sortDirection]);

  const tableColumns = useCallback(() => [
    {
      key: 'flight_iata',
      title: 'Flight',
      sortable: true,
      width: 100,
    },
    {
      key: 'route',
      title: 'Route',
      sortable: true,
      width: 120,
      render: (_: any, row: FlightLog) => {
        const departure = row.departure_iata || '-';
        const arrival = row.arrival_iata || '-';
        return <Text style={styles.cellText}>{departure} → {arrival}</Text>;
      }
    },
    {
      key: 'times',
      title: 'Times',
      width: 150,
      render: (_: any, row: FlightLog) => {
        const depTime = formatTime(row.departure_scheduled);
        const arrTime = formatTime(row.arrival_scheduled);
        return <Text style={styles.cellText}>{depTime} - {arrTime}</Text>;
      }
    },
    {
      key: 'airline_iata',
      title: 'Airline',
      sortable: true,
      width: 100,
    },
    {
      key: 'duration_hours',
      title: 'Duration',
      sortable: true,
      width: 100,
      render: (value: number) => {
        const duration = value && typeof value === 'number' ? value.toFixed(1) : '0.0';
        return <Text style={styles.cellText}>{duration}h</Text>;
      }
    },
    {
      key: 'flight_date',
      title: 'Date',
      sortable: true,
      width: 150,
      render: (value: string) => {
        const formattedDate = value ? formatDate(value) : '-';
        return <Text style={styles.cellText}>{formattedDate}</Text>;
      }
    },
  ], [formatTime, formatDate]);

  // ========================================================================
  // EFFECTS
  // ========================================================================
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ========================================================================
  // STYLES
  // ========================================================================
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      padding: 16,
      paddingTop: insets.top + 16,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
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
    refreshButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      alignSelf: 'center',
      marginTop: 16,
    },
    refreshButtonText: {
      color: '#ffffff',
      fontWeight: '600',
      fontSize: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      color: colors.text,
      marginTop: 10,
      fontSize: 16,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyText: {
      fontSize: 18,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    cellText: {
      fontSize: 14,
      color: colors.text,
    },
    authWarning: {
      backgroundColor: '#fee2e2',
      borderColor: '#fecaca',
      borderWidth: 1,
      borderRadius: 10,
      padding: 16,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    authWarningText: {
      flex: 1,
      color: '#dc2626',
      fontSize: 14,
      lineHeight: 20,
    },
  });

  // ========================================================================
  // RENDER HELPERS
  // ========================================================================
  const renderAuthWarning = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setSidebarVisible(true)}
          >
            <Menu size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Flight Logbooks</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.authWarning}>
          <Text style={styles.authWarningText}>
            Please log in to view your flight logbook. Authentication is required to access your flight data and statistics.
          </Text>
        </View>
      </View>
      
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
    </SafeAreaView>
  );

  const renderLoadingState = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setSidebarVisible(true)}
          >
            <Menu size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Flight Logbooks</Text>
        </View>
      </View>
      
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading flight data...</Text>
      </View>
      
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
    </SafeAreaView>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No flight logs found</Text>
      <Text style={styles.emptySubtext}>
        Saved flights will appear here
      </Text>
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={handleRefresh}
        disabled={refreshing}
      >
        <Text style={styles.refreshButtonText}>
          {refreshing ? 'Refreshing...' : 'Refresh Logs'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderDataTable = () => (
    <>
      <DataTable
        columns={tableColumns()}
        data={sortedLogs()}
        onSort={handleSort}
        sortKey={sortKey}
        sortDirection={sortDirection}
      />
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={handleRefresh}
        disabled={refreshing}
      >
        <Text style={styles.refreshButtonText}>
          {refreshing ? 'Refreshing...' : 'Refresh Logs'}
        </Text>
      </TouchableOpacity>
    </>
  );

  // ========================================================================
  // MAIN RENDER
  // ========================================================================
  if (!token) {
    return renderAuthWarning();
  }

  if (loading) {
    return renderLoadingState();
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setSidebarVisible(true)}
          >
            <Menu size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Flight Logbooks</Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {logs.length > 0 ? renderDataTable() : renderEmptyState()}
      </View>

      {/* Sidebar */}
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
    </SafeAreaView>
  );
}