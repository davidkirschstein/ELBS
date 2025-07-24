// ============================================================================
// IMPORTS
// ============================================================================

// React & React Native Core
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  Platform,
  ActivityIndicator,
  FlatList,
  Image,
  Button
} from 'react-native';

// Icons
import { 
  Calendar, 
  Plane, 
  Plus, 
  CircleAlert as AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  X, 
  ChartBar as BarChart2, 
  Clock, 
  CircleCheck as CheckCircle, 
  Circle as XCircle, 
  ArrowRight, 
  MapPin, 
  Upload, 
  Bell, 
  FileText,
  Menu
} from 'lucide-react-native';

// Third-party Libraries
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';

// Local Imports
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyState from '@/components/EmptyState';
import { useFlights } from '@/hooks/useFlights';
import Sidebar from '@/components/Sidebar';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface FlightCardProps {
  flight: any;
  colors: any;
}

interface ScheduleUploadCardProps {
  colors: any;
}

interface UpcomingFlightsProps {
  schedules: any[];
  colors: any;
}

// ============================================================================
// FLIGHT CARD COMPONENT
// ============================================================================

const FlightCard: React.FC<FlightCardProps> = ({ flight, colors }) => {
  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================
  const getDisplayValue = useCallback((value: any, fallback = 'N/A') => {
    return value && value !== null && value !== undefined ? String(value) : fallback;
  }, []);

  const formatTime = useCallback((dateString: string) => {
    if (!dateString) return '--:--';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    } catch (e) {
      return '--:--';
    }
  }, []);
  
  const getDuration = useCallback((departure: string, arrival: string) => {
    if (!departure || !arrival) return '--h --m';
    try {
      const dep = new Date(departure);
      const arr = new Date(arrival);
      if (isNaN(dep.getTime())) return '--h --m';
      if (isNaN(arr.getTime())) return '--h --m';
      
      const diff = Math.abs(arr.getTime() - dep.getTime());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch (e) {
      return '--h --m';
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    if (!status) return colors.text;
    switch (String(status).toLowerCase()) {
      case 'scheduled': return '#3b82f6';
      case 'active': return '#10b981';
      case 'landed': return '#8b5cf6';
      case 'cancelled': return '#ef4444';
      case 'incident': return '#f59e0b';
      case 'diverted': return '#ec4899';
      default: return colors.text;
    }
  }, [colors.text]);

  const getAirlineInitials = useCallback(() => {
    if (airlineCode && airlineCode.length >= 2) return airlineCode.substring(0, 2);
    if (airlineName) return airlineName.substring(0, 2).toUpperCase();
    return 'AL';
  }, []);

  const buildTerminalGateInfo = useCallback(() => {
    const parts = [];
    
    if (departureTerminal && departureTerminal !== 'N/A') {
      parts.push(`Terminal ${departureTerminal}`);
    }
    
    if (departureGate && departureGate !== 'N/A') {
      parts.push(`Gate ${departureGate}`);
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'Terminal/Gate info unavailable';
  }, []);

  // ========================================================================
  // DATA EXTRACTION
  // ========================================================================
  const airline = flight.airline || {};
  const flightInfo = flight.flight || {};
  const aircraft = flight.aircraft || {};
  const departure = flight.departure || {};
  const arrival = flight.arrival || {};
  
  const airlineName = getDisplayValue(airline.name, 'Airline');
  const airlineCode = getDisplayValue(airline.iata, airline.icao || 'AIR');
  const flightNumber = getDisplayValue(flightInfo.iata, flightInfo.icao || flightInfo.number || 'FLIGHT');
  const aircraftType = getDisplayValue(aircraft.icao, 'Aircraft');
  
  const departureAirport = getDisplayValue(departure.airport, 'Departure Airport');
  const departureIata = getDisplayValue(departure.iata, 'DEP');
  const departureTerminal = getDisplayValue(departure.terminal);
  const departureGate = getDisplayValue(departure.gate);
  const departureDelay = departure.delay || 0;
  
  const arrivalAirport = getDisplayValue(arrival.airport, 'Arrival Airport');
  const arrivalIata = getDisplayValue(arrival.iata, 'ARR');
  
  const flightStatus = getDisplayValue(flight.flight_status, 'unknown');

  // ========================================================================
  // STYLES
  // ========================================================================
  const flightCardStyles = StyleSheet.create({
    flightCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    flightHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    airlineLogo: {
      width: 40,
      height: 40,
      marginRight: 12,
      borderRadius: 8,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    airlineLogoPlaceholder: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primary,
    },
    airlineName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    flightNumber: {
      fontSize: 14,
      fontWeight: '500',
      marginTop: 4,
      color: colors.textSecondary,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      alignSelf: 'flex-start',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '700',
    },
    routeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    airportSection: {
      flex: 1,
    },
    airportCode: {
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 4,
      color: colors.text,
    },
    airportName: {
      fontSize: 13,
      fontWeight: '500',
      marginBottom: 12,
      color: colors.textSecondary,
    },
    timeText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    durationContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 100,
    },
    durationLine: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      width: '100%',
    },
    lineDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    durationLineInner: {
      flex: 1,
      height: 2,
      backgroundColor: colors.border,
    },
    durationText: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 8,
      color: colors.textSecondary,
    },
    detailsContainer: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    detailText: {
      fontSize: 13,
      fontWeight: '500',
      marginLeft: 8,
      color: colors.textSecondary,
    },
  });

  // ========================================================================
  // RENDER
  // ========================================================================
  return (
    <View style={flightCardStyles.flightCard}>
      <View style={flightCardStyles.flightHeader}>
        <View style={flightCardStyles.airlineLogo}>
          {airline.logo ? (
            <Image 
              source={{ uri: airline.logo }} 
              style={{ width: 40, height: 40 }} 
              resizeMode="contain"
            />
          ) : (
            <Text style={flightCardStyles.airlineLogoPlaceholder}>
              {getAirlineInitials()}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={flightCardStyles.airlineName}>
            {airlineName}
          </Text>
          <Text style={flightCardStyles.flightNumber}>
            {flightNumber} • {aircraftType}
          </Text>
        </View>
        <View style={[
          flightCardStyles.statusBadge, 
          { backgroundColor: getStatusColor(flightStatus) + '20' }
        ]}>
          <Text style={[flightCardStyles.statusText, { color: getStatusColor(flightStatus) }]}>
            {String(flightStatus).toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={flightCardStyles.routeContainer}>
        <View style={flightCardStyles.airportSection}>
          <Text style={flightCardStyles.airportCode}>
            {departureIata}
          </Text>
          <Text style={flightCardStyles.airportName}>
            {departureAirport}
          </Text>
          <Text style={flightCardStyles.timeText}>
            {formatTime(departure.scheduled)}
          </Text>
        </View>
        
        <View style={flightCardStyles.durationContainer}>
          <View style={flightCardStyles.durationLine}>
            <View style={[flightCardStyles.lineDot, { backgroundColor: getStatusColor(flightStatus) }]} />
            <View style={flightCardStyles.durationLineInner} />
            <View style={[flightCardStyles.lineDot, { backgroundColor: getStatusColor(flightStatus) }]} />
          </View>
          <Text style={flightCardStyles.durationText}>
            {getDuration(departure.scheduled, arrival.scheduled)}
          </Text>
          <ArrowRight size={20} color={colors.textSecondary} />
        </View>
        
        <View style={flightCardStyles.airportSection}>
          <Text style={flightCardStyles.airportCode}>
            {arrivalIata}
          </Text>
          <Text style={flightCardStyles.airportName}>
            {arrivalAirport}
          </Text>
          <Text style={flightCardStyles.timeText}>
            {formatTime(arrival.scheduled)}
          </Text>
        </View>
      </View>
      
      <View style={flightCardStyles.detailsContainer}>
        <View style={flightCardStyles.detailItem}>
          <MapPin size={16} color={colors.textSecondary} />
          <Text style={flightCardStyles.detailText}>
            {buildTerminalGateInfo()}
          </Text>
        </View>
        
        <View style={flightCardStyles.detailItem}>
          <Clock size={16} color={colors.textSecondary} />
          <Text style={flightCardStyles.detailText}>
            {departureDelay && departureDelay > 0 ? `Delayed ${departureDelay} mins` : 'On Time'}
          </Text>
        </View>
      </View>
    </View>
  );
};

// ============================================================================
// SCHEDULE UPLOAD CARD COMPONENT
// ============================================================================

const ScheduleUploadCard: React.FC<ScheduleUploadCardProps> = ({ colors }) => {
  const navigation = useNavigation();
  
  const styles = StyleSheet.create({
    uploadCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    uploadContent: {
      flex: 1,
    },
    uploadTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 6,
    },
    uploadDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    uploadButton: {
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    uploadButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.uploadCard}>
      <View style={styles.uploadContent}>
        <Text style={styles.uploadTitle}>Upload Flight Schedule</Text>
        <Text style={styles.uploadDescription}>
          Upload CSV/PDF to set your flight schedules and get notifications
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.uploadButton}
        onPress={() => navigation.navigate('ScheduleUpload')}
      >
        <Upload size={18} color="#fff" />
        <Text style={styles.uploadButtonText}>Upload</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============================================================================
// UPCOMING FLIGHTS COMPONENT
// ============================================================================

const UpcomingFlights: React.FC<UpcomingFlightsProps> = ({ schedules, colors }) => {
  // Ensure schedules is always an array
  const safeSchedules = Array.isArray(schedules) ? schedules : [];
  
  if (safeSchedules.length === 0) return null;
  
  const styles = StyleSheet.create({
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 18,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    sectionTitleIcon: {
      backgroundColor: colors.primary + '15',
      width: 36,
      height: 36,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scheduleItem: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    scheduleIcon: {
      backgroundColor: colors.primary + '20',
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    scheduleTextContainer: {
      flex: 1,
    },
    scheduleTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    scheduleDetails: {
      fontSize: 14,
      color: colors.textSecondary,
    },
  });

  return (
    <View style={{ marginTop: 20 }}>
      <View style={styles.sectionTitle}>
        <View style={styles.sectionTitleIcon}>
          <Bell color={colors.primary} size={20} />
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
          Your Upcoming Flights
        </Text>
      </View>
      
      {safeSchedules.map((schedule) => (
        <View key={schedule.id} style={styles.scheduleItem}>
          <View style={styles.scheduleIcon}>
            <Plane size={20} color={colors.primary} />
          </View>
          <View style={styles.scheduleTextContainer}>
            <Text style={styles.scheduleTitle}>
              {schedule.flight_number || 'N/A'} • {schedule.flight_name || 'Flight'}
            </Text>
            <Text style={styles.scheduleDetails}>
              {schedule.flight_date || 'TBD'} at {schedule.flight_time || 'TBD'}
              {schedule.standby_time && ` • Standby at ${schedule.standby_time}`}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

// ============================================================================
// MAIN SCHEDULE COMPONENT
// ============================================================================

function Schedule() {
  // ========================================================================
  // HOOKS & CONTEXT
  // ========================================================================
  const { colors } = useTheme();
  const { token } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [flightNumber, setFlightNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // ========================================================================
  // CONSTANTS
  // ========================================================================
  const tabBarHeight = Platform.OS === 'ios' ? 85 : 70;

  // ========================================================================
  // CUSTOM HOOKS
  // ========================================================================
  const {
    flights,
    loading,
    searchLoading,
    searchMode,
    fetchFlightsByDate,
    searchFlights,
    resetSearch
  } = useFlights(selectedDate, token);

  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================
  const formatDateForDisplay = useCallback((date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);
  
  const formatShortDate = useCallback((date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, []);

  const getStatusCounts = useCallback(() => {
    return {
      total: flights.length,
      scheduled: flights.filter(f => f.flight_status === 'scheduled').length,
      active: flights.filter(f => f.flight_status === 'active').length,
      completed: flights.filter(f => f.flight_status === 'completed').length,
      cancelled: flights.filter(f => f.flight_status === 'cancelled').length,
    };
  }, [flights]);

  // ========================================================================
  // DATA MANAGEMENT
  // ========================================================================
  const fetchSchedules = useCallback(async () => {
    try {
      if (!token) return;
      
      const response = await axios.get('/pilot-schedules', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Ensure we always set an array
      const data = response.data;
      if (Array.isArray(data)) {
        setSchedules(data);
      } else {
        console.warn('API returned non-array data:', data);
        setSchedules([]);
      }
    } catch (err) {
      console.error('Failed to fetch schedules', err);
      setSchedules([]); // Set empty array on error
    }
  }, [token]);

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================
  const handleSearch = useCallback(async () => {
    if (!flightNumber.trim()) {
      Alert.alert('Error', 'Please enter a flight number');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Authentication required. Please log in again.');
      return;
    }

    try {
      setError(null);
      await searchFlights(flightNumber, selectedDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
    }
  }, [flightNumber, token, selectedDate, searchFlights]);

  const handleClear = useCallback(() => {
    setFlightNumber('');
    setError(null);
    resetSearch();
  }, [resetSearch]);

  const handleDateChange = useCallback((event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setError(null);
      if (searchMode) {
        searchFlights(flightNumber, date);
      } else {
        fetchFlightsByDate(date);
      }
    }
  }, [searchMode, flightNumber, searchFlights, fetchFlightsByDate]);

  const navigateDate = useCallback((direction: 'next' | 'prev') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
    setError(null);
    if (searchMode) {
      searchFlights(flightNumber, newDate);
    } else {
      fetchFlightsByDate(newDate);
    }
  }, [selectedDate, searchMode, flightNumber, searchFlights, fetchFlightsByDate]);

  const goToToday = useCallback(() => {
    const today = new Date();
    setSelectedDate(today);
    setError(null);
    if (searchMode) {
      searchFlights(flightNumber, today);
    } else {
      fetchFlightsByDate(today);
    }
  }, [searchMode, flightNumber, searchFlights, fetchFlightsByDate]);

  // ========================================================================
  // COMPUTED VALUES
  // ========================================================================
  const statusCounts = getStatusCounts();

  // ========================================================================
  // EFFECTS
  // ========================================================================
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

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
    headerSubtitle: {
      fontSize: 14,
      color: '#fff',
      marginTop: 4,
      opacity: 0.9,
    },
    menuButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    headerActions: {
      flexDirection: 'row',
      gap: 10,
    },
    headerButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 18,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    sectionTitleIcon: {
      backgroundColor: colors.primary + '15',
      width: 36,
      height: 36,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchContainer: {
      marginBottom: 16,
    },
    searchBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingHorizontal: 16,
      height: 56,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchIcon: {
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      height: '100%',
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    clearButton: {
      padding: 8,
      marginLeft: 8,
    },
    dateSection: {
      marginBottom: 16,
    },
    dateNavigation: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 15,
    },
    navButton: {
      width: 46,
      height: 46,
      backgroundColor: colors.surface,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderWidth: 1,
      borderColor: colors.border,
      flex: 1,
      marginHorizontal: 12,
    },
    dateText: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 10,
    },
    dateStatusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dateStatusText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    todayButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.primary + '15',
      borderRadius: 10,
    },
    todayButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    errorContainer: {
      backgroundColor: '#fee2e2',
      borderLeftWidth: 4,
      borderLeftColor: '#ef4444',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    errorText: {
      flex: 1,
      color: '#b91c1c',
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
    },
    resultsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    resultsTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
    },
    resultsSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    flightCountBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      marginLeft: 10,
    },
    flightCountText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
    showAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 14,
      backgroundColor: colors.primary + '10',
      borderRadius: 10,
    },
    showAllButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    flightsList: {
      gap: 18,
    },
    statsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    statsTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    statCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      width: '48%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    statValue: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      marginTop: 8,
    },
    statLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
      fontWeight: '500',
    },
    statIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      color: colors.textSecondary,
      fontSize: 16,
      marginTop: 16,
      fontWeight: '500',
    },
    statusIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: colors.primary + '10',
      borderRadius: 20,
      marginTop: 5,
    },
    statusIndicatorText: {
      fontSize: 13,
      fontWeight: '600',
      marginLeft: 8,
      color: colors.textSecondary,
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
          <View>
            <Text style={styles.headerTitle}>Flight Schedule</Text>
            <Text style={styles.headerSubtitle}>Authentication Required</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.authWarning}>
          <AlertCircle color="#ef4444" size={24} />
          <Text style={styles.authWarningText}>
            Please log in to view flight schedules. Authentication is required to access flight data.
          </Text>
        </View>
      </View>
      
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
    </SafeAreaView>
  );

  const renderSearchSection = () => (
    <View style={styles.card}>
      <View style={styles.searchBarContainer}>
        <Search color={colors.textSecondary} size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Enter flight number (e.g., AA123)"
          placeholderTextColor={colors.textSecondary}
          value={flightNumber}
          onChangeText={setFlightNumber}
          autoCapitalize="characters"
          autoCorrect={false}
          onSubmitEditing={handleSearch}
        />
        {flightNumber.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
          >
            <X color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          onPress={handleSearch}
          disabled={searchLoading}
          style={{
            backgroundColor: colors.primary,
            padding: 12,
            borderRadius: 12,
            marginLeft: 10
          }}
        >
          {searchLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Search color="#fff" size={20} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDateSection = () => (
    <View style={styles.card}>
      <View style={styles.sectionTitle}>
        <View style={styles.sectionTitleIcon}>
          <Calendar color={colors.primary} size={20} />
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
          Select Date
        </Text>
      </View>
      
      <View style={styles.dateNavigation}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateDate('prev')}
        >
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Calendar color={colors.primary} size={20} />
          <Text style={styles.dateText}>
            {formatShortDate(selectedDate)}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateDate('next')}
        >
          <ChevronRight color={colors.text} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.dateStatusContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[
            { 
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: isToday(selectedDate) ? '#10b981' : colors.primary,
              marginRight: 10
            }
          ]} />
          <Text style={styles.dateStatusText}>
            {isToday(selectedDate) ? 'Today' : formatDateForDisplay(selectedDate)}
          </Text>
        </View>
        
        {!isToday(selectedDate) && (
          <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
            <Text style={styles.todayButtonText}>Go to Today</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderFlightResults = () => (
    <View style={styles.card}>
      <View style={styles.resultsHeader}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.resultsTitle}>
              {searchMode ? 'Search Results' : 'Scheduled Flights'}
            </Text>
            <View style={styles.flightCountBadge}>
              <Text style={styles.flightCountText}>{flights.length}</Text>
            </View>
          </View>
          <Text style={styles.resultsSubtitle}>
            {formatDateForDisplay(selectedDate)}
            {isToday(selectedDate) && ' • Today'}
          </Text>
          
          {flights.length > 0 && (
            <View style={styles.statusIndicator}>
              <BarChart2 size={16} color={colors.textSecondary} />
              <Text style={styles.statusIndicatorText}>
                {statusCounts.active} active • {statusCounts.scheduled} scheduled
              </Text>
            </View>
          )}
        </View>
        
        {searchMode && (
          <TouchableOpacity style={styles.showAllButton} onPress={handleClear}>
            <X size={18} color={colors.primary} />
            <Text style={styles.showAllButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading flights...</Text>
        </View>
      ) : flights.length > 0 ? (
        <FlatList
          data={flights}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <FlightCard flight={item} colors={colors} />}
          contentContainerStyle={styles.flightsList}
          scrollEnabled={false}
        />
      ) : searchMode ? (
        <EmptyState
          type="no-search-results"
          date={formatDateForDisplay(selectedDate)}
          flightNumber={flightNumber}
          onReset={handleClear}
        />
      ) : (
        <EmptyState
          type="no-flights"
          date={formatDateForDisplay(selectedDate)}
        />
      )}
    </View>
  );

  const renderStatistics = () => (
    flights.length > 0 && (
      <View style={styles.card}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>Flight Status Summary</Text>
          <BarChart2 color={colors.primary} size={24} />
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Plane color={colors.primary} size={24} />
            </View>
            <Text style={styles.statValue}>{statusCounts.total}</Text>
            <Text style={styles.statLabel}>Total Flights</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#60a5fa15' }]}>
              <Clock color="#60a5fa" size={24} />
            </View>
            <Text style={[styles.statValue, { color: '#60a5fa' }]}>{statusCounts.scheduled}</Text>
            <Text style={styles.statLabel}>Scheduled</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#f59e0b15' }]}>
              <Plane color="#f59e0b" size={24} />
            </View>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>{statusCounts.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#34d39915' }]}>
              <CheckCircle color="#34d399" size={24} />
            </View>
            <Text style={[styles.statValue, { color: '#34d399' }]}>{statusCounts.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#f8717115' }]}>
              <XCircle color="#f87171" size={24} />
            </View>
            <Text style={[styles.statValue, { color: '#f87171' }]}>{statusCounts.cancelled}</Text>
            <Text style={styles.statLabel}>Cancelled</Text>
          </View>
        </View>
      </View>
    )
  );

  // ========================================================================
  // MAIN RENDER
  // ========================================================================
  if (!token) {
    return renderAuthWarning();
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
          <View>
            <Text style={styles.headerTitle}>Flight Schedule</Text>
            <Text style={styles.headerSubtitle}>Track flights across past, present, and future</Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('ScheduleUpload')}
          >
            <Upload color="#fff" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 30 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Schedule Upload Card */}
        <ScheduleUploadCard colors={colors} />

        {/* Search Section */}
        {renderSearchSection()}

        {/* Date Selection */}
        {renderDateSection()}

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <AlertCircle color="#ef4444" size={24} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Flight Results */}
        {renderFlightResults()}

        {/* Statistics */}
        {renderStatistics()}

        {/* Upcoming Flights */}
        <UpcomingFlights schedules={schedules} colors={colors} />
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {/* Sidebar */}
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
    </SafeAreaView>
  );
}

// ============================================================================
// SCHEDULE UPLOAD SCREEN COMPONENT
// ============================================================================

export function ScheduleUploadScreen() {
  // ========================================================================
  // HOOKS & CONTEXT
  // ========================================================================
  const { colors } = useTheme();
  const { token } = useAuth();
  const navigation = useNavigation();

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  const [file, setFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);

  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================
  const fetchSchedules = useCallback(async () => {
    try {
      const response = await axios.get('/pilot-schedules', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Ensure we always set an array
      const data = response.data;
      if (Array.isArray(data)) {
        setSchedules(data);
      } else {
        console.warn('API returned non-array data:', data);
        setSchedules([]);
      }
    } catch (err) {
      console.error('Failed to fetch schedules', err);
      setSchedules([]); // Set empty array on error
    }
  }, [token]);

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================
  const handleFilePick = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/pdf'],
      });
      
      if (result.type === 'success') {
        setFile(result);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick file');
    }
  }, []);

  const handleFileUpload = useCallback(async () => {
    if (!file) {
      Alert.alert('Error', 'Please select a file first');
      return;
    }
    
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('scheduleFile', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
      } as any);
      
      const response = await axios.post('/upload-schedule', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        Alert.alert('Success', response.data.message);
        fetchSchedules();
      }
    } catch (err) {
      Alert.alert('Error', 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [file, token, fetchSchedules]);

  // ========================================================================
  // EFFECTS
  // ========================================================================
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // ========================================================================
  // STYLES
  // ========================================================================
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 30,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginLeft: 16,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    dropZone: {
      borderWidth: 2,
      borderColor: colors.primary,
      borderStyle: 'dashed',
      borderRadius: 16,
      padding: 30,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    uploadButton: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 14,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
    },
    uploadButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    scheduleItem: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    scheduleIcon: {
      backgroundColor: colors.primary + '20',
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    fileName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginTop: 10,
      textAlign: 'center',
    },
    fileType: {
      color: colors.textSecondary,
      marginTop: 5,
      textAlign: 'center',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 15,
      color: colors.text,
    },
  });

  // ========================================================================
  // RENDER
  // ========================================================================
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={32} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Schedule</Text>
      </View>
      
      <ScrollView>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Upload Pilot Schedule</Text>
          <Text style={{ color: colors.textSecondary, marginBottom: 20 }}>
            Upload a CSV file with pilot schedules. The file should include columns:
            name, email, flightDate, flightTime, flightNumber, flightName
          </Text>
          
          <TouchableOpacity 
            style={styles.dropZone}
            onPress={handleFilePick}
          >
            <Upload size={40} color={colors.primary} />
            <Text style={styles.fileName}>
              {file ? file.name : 'Select a file'}
            </Text>
            <Text style={styles.fileType}>
              {file ? `Type: ${file.mimeType}` : 'CSV or PDF format'}
            </Text>
          </TouchableOpacity>
          
          <Button 
            title={uploading ? "Processing..." : "Upload Schedule"}
            onPress={handleFileUpload}
            disabled={!file || uploading}
            color={colors.primary}
          />
        </View>
        
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Upcoming Flights</Text>
          
          {Array.isArray(schedules) && schedules.length > 0 ? (
            schedules.map((schedule) => (
              <View key={schedule.id} style={styles.scheduleItem}>
                <View style={styles.scheduleIcon}>
                  <Bell size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={{ fontWeight: '600', color: colors.text }}>
                    {schedule.flight_number || 'N/A'} • {schedule.flight_name || 'Flight'}
                  </Text>
                  <Text style={{ color: colors.textSecondary }}>
                    {schedule.flight_date || 'TBD'} at {schedule.flight_time || 'TBD'}
                    {schedule.standby_time && ` • Standby at ${schedule.standby_time}`}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={{ alignItems: 'center', padding: 20 }}>
              <FileText size={40} color={colors.textSecondary} />
              <Text style={{ marginTop: 10, color: colors.textSecondary }}>
                No scheduled flights
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default Schedule;



// // app/(tabs)/schedule.tsx
// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { 
//   View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
//   Platform, ActivityIndicator, Alert, TextInput, RefreshControl, Modal
// } from 'react-native';
// import { Calendar, Clock, Plus, Search, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react-native';
// import { useTheme } from '@/contexts/ThemeContext';
// import Sidebar from '@/components/Sidebar';
// import axios from 'axios';
// import moment from 'moment-timezone';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import { 
//   format, addMonths, subMonths, startOfMonth, endOfMonth, 
//   eachDayOfInterval, isSameMonth, isSameDay, addDays, subDays
// } from 'date-fns';

// interface Flight {
//   id: number;
//   flight_iata: string;
//   flight_date: string;
//   departure_iata: string;
//   arrival_iata: string;
//   departure_scheduled: string;
//   arrival_scheduled: string;
//   airline_iata: string;
//   duration_hours: number;
//   flight_status: string;
//   departure_airport: string;
//   arrival_airport: string;
//   departure_terminal?: string;
//   departure_gate?: string;
//   arrival_terminal?: string;
//   arrival_gate?: string;
//   departure_timezone?: string;
//   arrival_timezone?: string;
// }

// export default function Schedule() {
//   const { colors } = useTheme();
//   const [sidebarVisible, setSidebarVisible] = useState(false);
//   const [selectedDate, setSelectedDate] = useState(new Date());
//   const [flights, setFlights] = useState<Flight[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [flightNumber, setFlightNumber] = useState('');
//   const [searchMode, setSearchMode] = useState(false);
//   const [searchLoading, setSearchLoading] = useState(false);
//   const [showCalendar, setShowCalendar] = useState(false);
//   const [currentMonth, setCurrentMonth] = useState(new Date());
//   const dateInputRef = useRef<TextInput>(null);

//   // Dynamic styles
//   const styles = StyleSheet.create({
//     container: {
//       flex: 1,
//       backgroundColor: colors.background,
//       paddingBottom: Platform.OS === 'ios' ? 85 : 70,
//     },
//     header: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       justifyContent: 'space-between',
//       paddingHorizontal: 16,
//       paddingVertical: 12,
//       paddingTop: 50,
//       backgroundColor: colors.primary,
//       marginBottom: 20,
//     },
//     headerLeft: {
//       flexDirection: 'row',
//       alignItems: 'center',
//     },
//     headerTitle: {
//       fontSize: 20,
//       fontWeight: '600',
//       color: '#ffffff',
//       marginLeft: 12,
//     },
//     menuButton: {
//       padding: 8,
//       borderRadius: 8,
//       backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     },
//     addButton: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       backgroundColor: 'rgba(255, 255, 255, 0.2)',
//       paddingHorizontal: 12,
//       paddingVertical: 8,
//       borderRadius: 8,
//     },
//     buttonText: {
//       color: '#ffffff',
//       fontWeight: '600',
//       marginLeft: 8,
//       fontSize: 14,
//     },
//     content: {
//       flex: 1,
//       padding: 16,
//     },
//     searchContainer: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       marginBottom: 16,
//       gap: 8,
//     },
//     searchInput: {
//       flex: 1,
//       height: 48,
//       backgroundColor: colors.card,
//       borderRadius: 12,
//       paddingHorizontal: 16,
//       color: colors.text,
//       fontSize: 16,
//       borderWidth: 1,
//       borderColor: colors.border,
//     },
//     searchButton: {
//       width: 48,
//       height: 48,
//       borderRadius: 12,
//       backgroundColor: colors.primary,
//       justifyContent: 'center',
//       alignItems: 'center',
//     },
//     dateNavContainer: {
//       flexDirection: 'row',
//       justifyContent: 'space-between',
//       marginBottom: 16,
//     },
//     dateButton: {
//       padding: 10,
//       borderRadius: 8,
//       backgroundColor: colors.surface,
//     },
//     dateSelector: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       justifyContent: 'space-between',
//       backgroundColor: colors.card,
//       borderRadius: 12,
//       padding: 16,
//       marginBottom: 20,
//       borderWidth: 1,
//       borderColor: colors.border,
//       position: 'relative',
//     },
//     dateText: {
//       fontSize: 18,
//       fontWeight: '600',
//       color: colors.text,
//     },
//     datePickerButton: {
//       padding: 8,
//       borderRadius: 8,
//       backgroundColor: colors.surface,
//     },
//     flightsList: {
//       flex: 1,
//     },
//     sectionTitle: {
//       fontSize: 18,
//       fontWeight: '600',
//       color: colors.text,
//       marginBottom: 16,
//     },
//     flightCard: {
//       backgroundColor: colors.card,
//       borderRadius: 12,
//       padding: 16,
//       marginBottom: 12,
//       borderWidth: 1,
//       borderColor: colors.border,
//       elevation: 2,
//       shadowColor: '#000',
//       shadowOffset: { width: 0, height: 2 },
//       shadowOpacity: 0.1,
//       shadowRadius: 4,
//     },
//     flightHeader: {
//       flexDirection: 'row',
//       justifyContent: 'space-between',
//       alignItems: 'center',
//       marginBottom: 12,
//     },
//     flightNumber: {
//       fontSize: 18,
//       fontWeight: '700',
//       color: colors.primary,
//     },
//     statusBadge: {
//       paddingHorizontal: 12,
//       paddingVertical: 6,
//       borderRadius: 16,
//     },
//     statusText: {
//       fontSize: 12,
//       fontWeight: '600',
//       color: '#ffffff',
//     },
//     flightDetails: {
//       gap: 8,
//     },
//     detailRow: {
//       flexDirection: 'row',
//       alignItems: 'center',
//     },
//     detailText: {
//       fontSize: 14,
//       color: colors.text,
//       marginLeft: 8,
//     },
//     routeContainer: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       justifyContent: 'center',
//       paddingVertical: 12,
//       backgroundColor: colors.surface,
//       borderRadius: 8,
//       marginTop: 8,
//       marginBottom: 8,
//     },
//     routeText: {
//       fontSize: 16,
//       fontWeight: '600',
//       color: colors.text,
//     },
//     routeArrow: {
//       fontSize: 16,
//       color: colors.textSecondary,
//       marginHorizontal: 12,
//     },
//     infoSection: {
//       marginTop: 12,
//       paddingTop: 12,
//       borderTopWidth: 1,
//       borderTopColor: colors.border,
//     },
//     infoTitle: {
//       fontSize: 14,
//       fontWeight: '600',
//       color: colors.textSecondary,
//       marginBottom: 8,
//     },
//     infoRow: {
//       flexDirection: 'row',
//       justifyContent: 'space-between',
//       marginBottom: 8,
//     },
//     infoLabel: {
//       fontSize: 14,
//       color: colors.textSecondary,
//     },
//     infoValue: {
//       fontSize: 14,
//       fontWeight: '600',
//       color: colors.text,
//     },
//     durationText: {
//       fontSize: 14,
//       color: colors.textSecondary,
//       fontStyle: 'italic',
//       marginTop: 8,
//     },
//     sourceText: {
//       fontSize: 12,
//       color: colors.textSecondary,
//       marginTop: 12,
//       fontStyle: 'italic',
//     },
//     emptyState: {
//       padding: 16,
//       alignItems: 'center',
//     },
//     emptyText: {
//       fontSize: 16,
//       color: colors.textSecondary,
//       textAlign: 'center',
//     },
//     loadingContainer: {
//       flex: 1,
//       justifyContent: 'center',
//       alignItems: 'center',
//     },
//     clearButton: {
//       position: 'absolute',
//       right: 16,
//       padding: 8,
//     },
//     calendarModal: {
//       flex: 1,
//       justifyContent: 'center',
//       alignItems: 'center',
//       backgroundColor: 'rgba(0,0,0,0.5)',
//     },
//     calendarContainer: {
//       backgroundColor: colors.card,
//       borderRadius: 12,
//       padding: 16,
//       width: '90%',
//       maxWidth: 400,
//     },
//     calendarHeader: {
//       flexDirection: 'row',
//       justifyContent: 'space-between',
//       alignItems: 'center',
//       marginBottom: 16,
//     },
//     calendarMonthText: {
//       fontSize: 20,
//       fontWeight: '600',
//       color: colors.text,
//     },
//     calendarDaysContainer: {
//       flexDirection: 'row',
//       justifyContent: 'space-between',
//       marginBottom: 8,
//     },
//     calendarDayHeader: {
//       width: 40,
//       textAlign: 'center',
//       fontWeight: '600',
//       color: colors.textSecondary,
//     },
//     calendarGrid: {
//       flexDirection: 'row',
//       flexWrap: 'wrap',
//     },
//     calendarDay: {
//       width: 40,
//       height: 40,
//       justifyContent: 'center',
//       alignItems: 'center',
//       borderRadius: 20,
//       margin: 2,
//     },
//     calendarDayText: {
//       color: colors.text,
//     },
//     todayText: {
//       color: colors.primary,
//       fontWeight: 'bold',
//     },
//     selectedDay: {
//       backgroundColor: colors.primary,
//     },
//     selectedDayText: {
//       color: '#fff',
//     },
//     nonMonthDay: {
//       opacity: 0.3,
//     },
//     closeButton: {
//       marginTop: 16,
//       padding: 12,
//       backgroundColor: colors.primary,
//       borderRadius: 8,
//       alignItems: 'center',
//     },
//     closeButtonText: {
//       color: '#fff',
//       fontWeight: '600',
//     },
//     timezoneIndicator: {
//       fontSize: 12,
//       color: colors.textSecondary,
//       marginTop: 4,
//     }
//   });

//   const getStatusColor = (status: string) => {
//     const statusColors: Record<string, string> = {
//       'scheduled': colors.warning,
//       'active': colors.success,
//       'cancelled': colors.error,
//       'completed': colors.primary,
//       'delayed': colors.warning,
//       'diverted': colors.error,
//       'incident': colors.error,
//       'landed': colors.success,
//       'unknown': colors.textSecondary
//     };
//     return statusColors[status] || colors.textSecondary;
//   };

//   const getStatusText = (status: string) => {
//     const statusMap: Record<string, string> = {
//       'scheduled': 'Scheduled',
//       'active': 'In Air',
//       'cancelled': 'Cancelled',
//       'completed': 'Landed',
//       'delayed': 'Delayed',
//       'diverted': 'Diverted',
//       'incident': 'Incident',
//       'landed': 'Landed',
//       'unknown': 'Unknown'
//     };
//     return statusMap[status] || status;
//   };

//   // Format time with timezone
//   const formatTime = (datetimeStr: string, timezone: string = 'UTC') => {
//     if (!datetimeStr) return '';
//     try {
//       return moment.utc(datetimeStr).tz(timezone).format('HH:mm');
//     } catch {
//       return datetimeStr.substring(11, 16);
//     }
//   };

//   // Get timezone abbreviation
//   const getTimezoneAbbr = (datetimeStr: string, timezone: string = 'UTC') => {
//     try {
//       return moment.utc(datetimeStr).tz(timezone).format('z');
//     } catch {
//       return timezone;
//     }
//   };

//   // Format flight date
//   const formatFlightDate = (date: Date) => {
//     return format(date, 'EEE, d MMM yyyy');
//   };

//   // Format for API requests
//   const formatAPIDate = (date: Date) => {
//     return format(date, 'yyyy-MM-dd');
//   };

//   // Fetch flights for selected date
//   const fetchFlightsByDate = useCallback(async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get(
//         `http://localhost:5000/flights-by-date?date=${formatAPIDate(selectedDate)}`
//       );
//       processFlightData(response.data);
//     } catch (error) {
//       console.error('Error fetching flights:', error);
//       setFlights([]);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, [selectedDate]);

//   // Search flights by flight number and date
//   const searchFlights = useCallback(async () => {
//     const validatedFlightNumber = flightNumber.trim().toUpperCase();
    
//     if (!validatedFlightNumber) {
//       Alert.alert('Input Required', 'Please enter a flight number');
//       return;
//     }
    
//     if (!/^[A-Z]{2}\d+$/.test(validatedFlightNumber)) {
//       Alert.alert('Invalid Format', 'Flight number must be in format AA1234');
//       return;
//     }

//     try {
//       setSearchLoading(true);
//       const response = await axios.get(
//         `http://localhost:5000/search-flight?flight_iata=${validatedFlightNumber}&date=${formatAPIDate(selectedDate)}`
//       );
      
//       let flightData = response.data;
//       if (!Array.isArray(flightData)) {
//         flightData = [flightData];
//       }
      
//       if (flightData.length === 0) {
//         Alert.alert('No Results', 'No flights found for your search criteria');
//       }
      
//       processFlightData(flightData);
//       setSearchMode(true);
//     } catch (error: any) {
//       console.error('Error searching flights:', error);
//       const errorMessage = error.response?.data?.message || 
//         error.message || 
//         'Failed to search flights. Please try again.';
//       Alert.alert('Search Error', errorMessage);
//       setFlights([]);
//     } finally {
//       setSearchLoading(false);
//     }
//   }, [flightNumber, selectedDate]);

//   // Process and enhance flight data
//   const processFlightData = (flightData: any) => {
//     if (!flightData) {
//       setFlights([]);
//       return;
//     }

//     const dataArray = Array.isArray(flightData) ? flightData : [flightData];
//     const terminals = ['1', '2', '3', '4', '5'];
//     const gates = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2'];
//     const timezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'];
    
//     const flightsWithDetails = dataArray.map((flight) => {
//       let durationHours = flight.duration_hours;
//       if (typeof durationHours === 'string') {
//         durationHours = parseFloat(durationHours);
//       }
      
//       return {
//         ...flight,
//         duration_hours: isNaN(durationHours) ? 0 : durationHours,
//         departure_terminal: flight.departure_terminal || terminals[Math.floor(Math.random() * terminals.length)],
//         departure_gate: flight.departure_gate || gates[Math.floor(Math.random() * gates.length)],
//         arrival_terminal: flight.arrival_terminal || terminals[Math.floor(Math.random() * terminals.length)],
//         arrival_gate: flight.arrival_gate || gates[Math.floor(Math.random() * gates.length)],
//         departure_airport: flight.departure_airport || `${flight.departure_iata} Airport`,
//         arrival_airport: flight.arrival_airport || `${flight.departure_iata} Airport`,
//         departure_timezone: flight.departure_timezone || timezones[Math.floor(Math.random() * timezones.length)],
//         arrival_timezone: flight.arrival_timezone || timezones[Math.floor(Math.random() * timezones.length)],
//       };
//     });
    
//     setFlights(flightsWithDetails);
//   };

//   // Reset search and show all flights
//   const resetSearch = () => {
//     setFlightNumber('');
//     setSearchMode(false);
//     fetchFlightsByDate();
//   };

//   // Refresh control handler
//   const onRefresh = () => {
//     setRefreshing(true);
//     if (searchMode) {
//       searchFlights();
//     } else {
//       fetchFlightsByDate();
//     }
//   };

//   // Date navigation
//   const navigateDate = (days: number) => {
//     const newDate = new Date(selectedDate);
//     newDate.setDate(newDate.getDate() + days);
//     setSelectedDate(newDate);
//   };

//   // Handle date change
//   const handleDateChange = (event: any, newDate?: Date) => {
//     setShowDatePicker(false);
//     if (newDate) {
//       setSelectedDate(newDate);
//     }
//   };

//   // Calendar navigation
//   const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
//   const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

//   // Generate calendar days
//   const calendarDays = eachDayOfInterval({
//     start: startOfMonth(currentMonth),
//     end: endOfMonth(currentMonth),
//   });

//   // Pad calendar with empty days
//   const startDay = startOfMonth(currentMonth).getDay();
//   const emptyDays = Array(startDay).fill(null);

//   // Select date from calendar
//   const selectDate = (date: Date) => {
//     setSelectedDate(date);
//     setShowCalendar(false);
//   };

//   // Calendar component
//   const renderCalendar = () => {
//     const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
//     const today = new Date();

//     return (
//       <Modal
//         visible={showCalendar}
//         transparent={true}
//         animationType="fade"
//         onRequestClose={() => setShowCalendar(false)}
//       >
//         <View style={styles.calendarModal}>
//           <View style={styles.calendarContainer}>
//             <View style={styles.calendarHeader}>
//               <TouchableOpacity onPress={prevMonth}>
//                 <ChevronLeft size={24} color={colors.text} />
//               </TouchableOpacity>
//               <Text style={styles.calendarMonthText}>
//                 {format(currentMonth, 'MMMM yyyy')}
//               </Text>
//               <TouchableOpacity onPress={nextMonth}>
//                 <ChevronRight size={24} color={colors.text} />
//               </TouchableOpacity>
//             </View>
            
//             <View style={styles.calendarDaysContainer}>
//               {daysOfWeek.map((day) => (
//                 <Text key={day} style={styles.calendarDayHeader}>{day}</Text>
//               ))}
//             </View>
            
//             <View style={styles.calendarGrid}>
//               {emptyDays.map((_, index) => (
//                 <View key={`empty-${index}`} style={styles.calendarDay} />
//               ))}
              
//               {calendarDays.map((day, index) => {
//                 const isToday = isSameDay(day, today);
//                 const isSelected = isSameDay(day, selectedDate);
//                 const isCurrentMonth = isSameMonth(day, currentMonth);
                
//                 return (
//                   <TouchableOpacity
//                     key={index}
//                     style={[
//                       styles.calendarDay,
//                       isToday && !isSelected && { borderWidth: 1, borderColor: colors.primary },
//                       isSelected && styles.selectedDay,
//                       !isCurrentMonth && styles.nonMonthDay,
//                     ]}
//                     onPress={() => isCurrentMonth && selectDate(day)}
//                     disabled={!isCurrentMonth}
//                   >
//                     <Text style={[
//                       styles.calendarDayText,
//                       isToday && styles.todayText,
//                       isSelected && styles.selectedDayText,
//                     ]}>
//                       {format(day, 'd')}
//                     </Text>
//                   </TouchableOpacity>
//                 );
//               })}
//             </View>
            
//             <TouchableOpacity 
//               style={styles.closeButton}
//               onPress={() => setShowCalendar(false)}
//             >
//               <Text style={styles.closeButtonText}>Close</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     );
//   };

//   useEffect(() => {
//     fetchFlightsByDate();
//   }, [fetchFlightsByDate]);

//   if (loading && !refreshing) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.header}>
//           <View style={styles.headerLeft}>
//             <TouchableOpacity 
//               style={styles.menuButton}
//               onPress={() => setSidebarVisible(true)}
//             >
//               <Menu size={24} color="#ffffff" />
//             </TouchableOpacity>
//             <Text style={styles.headerTitle}>Flight Schedule</Text>
//           </View>
          
//           <TouchableOpacity style={styles.addButton}>
//             <Plus size={18} color="#ffffff" />
//             <Text style={styles.buttonText}>Add Flight</Text>
//           </TouchableOpacity>
//         </View>
        
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={colors.primary} />
//           <Text style={{ color: colors.text, marginTop: 10 }}>
//             {searchMode ? 'Searching flights...' : 'Loading flight data...'}
//           </Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <View style={styles.headerLeft}>
//           <TouchableOpacity 
//             style={styles.menuButton}
//             onPress={() => setSidebarVisible(true)}
//           >
//             <Menu size={24} color="#ffffff" />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Flight Schedule</Text>
//         </View>
        
//         <TouchableOpacity style={styles.addButton}>
//           <Plus size={18} color="#ffffff" />
//           <Text style={styles.buttonText}>Add Flight</Text>
//         </TouchableOpacity>
//       </View>
      
//       <ScrollView 
//         style={styles.content}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             tintColor={colors.primary}
//           />
//         }
//       >
//         <View style={styles.searchContainer}>
//           <View style={{ flex: 1, position: 'relative' }}>
//             <TextInput
//               style={styles.searchInput}
//               placeholder="Enter flight number (e.g., AA123)"
//               placeholderTextColor={colors.textSecondary}
//               value={flightNumber}
//               onChangeText={setFlightNumber}
//               autoCapitalize="characters"
//               onSubmitEditing={searchFlights}
//             />
//             {flightNumber.length > 0 && (
//               <TouchableOpacity 
//                 style={styles.clearButton}
//                 onPress={() => setFlightNumber('')}
//               >
//                 <X size={20} color={colors.textSecondary} />
//               </TouchableOpacity>
//             )}
//           </View>
          
//           <TouchableOpacity 
//             style={styles.searchButton}
//             onPress={searchFlights}
//             disabled={searchLoading}
//           >
//             {searchLoading ? (
//               <ActivityIndicator size="small" color="#ffffff" />
//             ) : (
//               <Search size={24} color="#ffffff" />
//             )}
//           </TouchableOpacity>
//         </View>
        
//         <View style={styles.dateNavContainer}>
//           <TouchableOpacity 
//             style={styles.dateButton}
//             onPress={() => navigateDate(-1)}
//           >
//             <ChevronLeft size={24} color={colors.primary} />
//           </TouchableOpacity>
          
//           <TouchableOpacity 
//             style={styles.dateSelector}
//             onPress={() => setShowCalendar(true)}
//           >
//             <Text style={styles.dateText}>
//               {formatFlightDate(selectedDate)}
//             </Text>
//             <Calendar size={24} color={colors.primary} />
//           </TouchableOpacity>
          
//           <TouchableOpacity 
//             style={styles.dateButton}
//             onPress={() => navigateDate(1)}
//           >
//             <ChevronRight size={24} color={colors.primary} />
//           </TouchableOpacity>
//         </View>

//         <View style={styles.flightsList}>
//           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
//             <Text style={styles.sectionTitle}>
//               {searchMode 
//                 ? `Search Results (${flights.length})` 
//                 : flights.length > 0 
//                   ? 'Scheduled Flights' 
//                   : 'No Flights Scheduled'
//               }
//             </Text>
            
//             {searchMode && (
//               <TouchableOpacity onPress={resetSearch}>
//                 <Text style={{ color: colors.primary, fontWeight: '600' }}>Show All</Text>
//               </TouchableOpacity>
//             )}
//           </View>
          
//           {flights.length > 0 ? flights.map((flight) => (
//             <View key={`${flight.id}-${flight.flight_date}`} style={styles.flightCard}>
//               <View style={styles.flightHeader}>
//                 <Text style={styles.flightNumber}>
//                   {flight.airline_iata} {flight.flight_iata}
//                 </Text>
//                 <View style={[styles.statusBadge, { backgroundColor: getStatusColor(flight.flight_status) }]}>
//                   <Text style={styles.statusText}>
//                     {getStatusText(flight.flight_status)}
//                   </Text>
//                 </View>
//               </View>
              
//               <View style={styles.flightDetails}>
//                 <View style={styles.detailRow}>
//                   <Clock size={16} color={colors.textSecondary} />
//                   <Text style={styles.detailText}>
//                     {format(selectedDate, 'EEE')} • {format(selectedDate, 'd MMM')}
//                   </Text>
//                 </View>
                
//                 <View style={styles.routeContainer}>
//                   <View>
//                     <Text style={styles.routeText}>{flight.departure_iata}</Text>
//                     <Text style={styles.timezoneIndicator}>
//                       {getTimezoneAbbr(flight.departure_scheduled, flight.departure_timezone)}
//                     </Text>
//                   </View>
//                   <Text style={styles.routeArrow}>→</Text>
//                   <View>
//                     <Text style={styles.routeText}>{flight.arrival_iata}</Text>
//                     <Text style={styles.timezoneIndicator}>
//                       {getTimezoneAbbr(flight.arrival_scheduled, flight.arrival_timezone)}
//                     </Text>
//                   </View>
//                 </View>
                
//                 <Text style={styles.detailText}>
//                   {flight.departure_airport}
//                 </Text>
//                 <Text style={styles.detailText}>
//                   {flight.arrival_airport}
//                 </Text>
//               </View>
              
//               <View style={styles.infoSection}>
//                 <Text style={styles.infoTitle}>Departure</Text>
//                 <View style={styles.infoRow}>
//                   <Text style={styles.infoLabel}>Scheduled</Text>
//                   <Text style={styles.infoValue}>
//                     {formatTime(flight.departure_scheduled, flight.departure_timezone)}
//                   </Text>
//                 </View>
//                 <View style={styles.infoRow}>
//                   <Text style={styles.infoLabel}>Terminal</Text>
//                   <Text style={styles.infoValue}>
//                     {flight.departure_terminal || 'TBD'}
//                   </Text>
//                 </View>
//                 <View style={styles.infoRow}>
//                   <Text style={styles.infoLabel}>Gate</Text>
//                   <Text style={styles.infoValue}>
//                     {flight.departure_gate || '-'}
//                   </Text>
//                 </View>
//               </View>
              
//               <View style={styles.infoSection}>
//                 <Text style={styles.infoTitle}>Arrival</Text>
//                 <View style={styles.infoRow}>
//                   <Text style={styles.infoLabel}>Scheduled</Text>
//                   <Text style={styles.infoValue}>
//                     {formatTime(flight.arrival_scheduled, flight.arrival_timezone)}
//                   </Text>
//                 </View>
//                 <View style={styles.infoRow}>
//                   <Text style={styles.infoLabel}>Terminal</Text>
//                   <Text style={styles.infoValue}>
//                     {flight.arrival_terminal || 'TBD'}
//                   </Text>
//                 </View>
//                 <View style={styles.infoRow}>
//                   <Text style={styles.infoLabel}>Gate</Text>
//                   <Text style={styles.infoValue}>
//                     {flight.arrival_gate || '-'}
//                   </Text>
//                 </View>
//               </View>
              
//               <Text style={styles.durationText}>
//                 {flight.duration_hours.toFixed(1)}h flight
//               </Text>
              
//               <Text style={styles.sourceText}>
//                 Source: AviationStack • Updated recently
//               </Text>
//             </View>
//           )) : searchMode ? (
//             <View style={styles.emptyState}>
//               <Text style={styles.emptyText}>
//                 No flights found for {flightNumber} on {formatFlightDate(selectedDate)}
//               </Text>
//               <TouchableOpacity 
//                 onPress={resetSearch}
//                 style={{ marginTop: 12 }}
//               >
//                 <Text style={{ color: colors.primary, fontWeight: '600' }}>Show All Flights</Text>
//               </TouchableOpacity>
//             </View>
//           ) : (
//             <View style={styles.emptyState}>
//               <Text style={styles.emptyText}>
//                 No flights scheduled for {formatFlightDate(selectedDate)}
//               </Text>
//             </View>
//           )}
//         </View>
//       </ScrollView>

//       {showDatePicker && Platform.OS !== 'web' && (
//         <DateTimePicker
//           value={selectedDate}
//           mode="date"
//           display={Platform.OS === 'ios' ? 'spinner' : 'default'}
//           onChange={handleDateChange}
//         />
//       )}

//       {renderCalendar()}

//       <Sidebar 
//         visible={sidebarVisible}
//         onClose={() => setSidebarVisible(false)}
//       />
//     </SafeAreaView>
//   );
// }