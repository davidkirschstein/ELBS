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
  Modal, 
  ActivityIndicator 
} from 'react-native';
import { 
  Plane, 
  Search, 
  Save, 
  RotateCcw, 
  MapPin, 
  Calendar as CalendarIcon, 
  Menu, 
  CircleCheck as CheckCircle 
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Sidebar from '@/components/Sidebar';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface FlightData {
  flightIata: string;
  flightIcao: string;
  date: string;
  status: string;
  departureAirport: string;
  departureIata: string;
  departureIcao: string;
  departureTime: string;
  arrivalAirport: string;
  arrivalIata: string;
  arrivalIcao: string;
  arrivalTime: string;
  airlineName: string;
  airlineIata: string;
  duration: string;
}

type Mode = 'autofill' | 'manual';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AutoFill() {
  // ========================================================================
  // HOOKS & CONTEXT
  // ========================================================================
  const { colors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  const [flightNumber, setFlightNumber] = useState('');
  const [searchDate, setSearchDate] = useState(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSearchDatePicker, setShowSearchDatePicker] = useState(false);
  const [mode, setMode] = useState<Mode>('autofill');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  const [flightData, setFlightData] = useState<FlightData>({
    flightIata: '',
    flightIcao: '',
    date: '',
    status: 'scheduled',
    departureAirport: '',
    departureIata: '',
    departureIcao: '',
    departureTime: '',
    arrivalAirport: '',
    arrivalIata: '',
    arrivalIcao: '',
    arrivalTime: '',
    airlineName: '',
    airlineIata: '',
    duration: '',
  });

  // ========================================================================
  // CONSTANTS & CONFIGURATION
  // ========================================================================
  const API_BASE_URL = 'http://192.168.36.138:5000';
  const actionButtonHeight = 60;
  const actionButtonPadding = 20;
  const tabBarHeight = Platform.OS === 'ios' ? 90 : 70;
  const bottomSpacing = insets.bottom + tabBarHeight + actionButtonPadding;

  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================
  const getAuthHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }), [token]);

  const formatDate = useCallback((date: Date) => {
    return date.toISOString().split('T')[0];
  }, []);

  const formatTime = useCallback((datetimeStr: string | null | undefined): string => {
    if (!datetimeStr) return '';
    try {
      if (datetimeStr.includes('T')) {
        return datetimeStr.split('T')[1].substring(0, 5);
      }
      if (datetimeStr.includes(' ')) {
        return datetimeStr.split(' ')[1].substring(0, 5);
      }
      return datetimeStr.substring(0, 5);
    } catch {
      return datetimeStr;
    }
  }, []);

  const formatDisplayDate = useCallback((dateStr: string) => {
    if (!dateStr) return 'Select Date';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }, []);

  const formatTimeForDB = useCallback((time: string) => {
    if (!time) return null;
    const [hours, minutes] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
  }, []);

  // ========================================================================
  // DATA MANAGEMENT
  // ========================================================================
  const updateField = useCallback((field: keyof FlightData, value: string) => {
    setFlightData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetFlightData = useCallback(() => {
    setFlightData({
      flightIata: '',
      flightIcao: '',
      date: '',
      status: 'scheduled',
      departureAirport: '',
      departureIata: '',
      departureIcao: '',
      departureTime: '',
      arrivalAirport: '',
      arrivalIata: '',
      arrivalIcao: '',
      arrivalTime: '',
      airlineName: '',
      airlineIata: '',
      duration: '',
    });
  }, []);

  const handleReset = useCallback(() => {
    setFlightNumber('');
    setSearchDate(new Date());
    resetFlightData();
  }, [resetFlightData]);

  // ========================================================================
  // API OPERATIONS
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

    setIsLoading(true);
    const cleanedFlightNumber = flightNumber.trim().toUpperCase().replace(/\s/g, '');
    const formattedDate = formatDate(searchDate);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/search-flight`,
        { 
          params: { 
            flight_iata: cleanedFlightNumber,
            date: formattedDate
          },
          headers: getAuthHeaders()
        }
      );
      
      const data = Array.isArray(response.data) ? response.data[0] : response.data;
      
      if (!data || (Array.isArray(response.data) && response.data.length === 0)) {
        Alert.alert(
          'Flight Not Found', 
          `No data found for flight ${cleanedFlightNumber} on ${formattedDate}`,
          [{ text: 'OK' }]
        );
        return;
      }
      
      setFlightData({
        flightIata: data.flight_iata || '',
        flightIcao: data.flight_icao || '',
        date: data.flight_date || formattedDate,
        status: data.flight_status || 'scheduled',
        departureAirport: data.departure_airport || '',
        departureIata: data.departure_iata || '',
        departureIcao: data.departure_icao || '',
        departureTime: formatTime(data.departure_scheduled),
        arrivalAirport: data.arrival_airport || '',
        arrivalIata: data.arrival_iata || '',
        arrivalIcao: data.arrival_icao || '',
        arrivalTime: formatTime(data.arrival_scheduled),
        airlineName: data.airline_name || '',
        airlineIata: data.airline_iata || '',
        duration: data.duration_hours?.toString() || '',
      });

      Alert.alert(
        'Flight Found!', 
        `Successfully loaded data for ${data.flight_iata}\n${data.departure_iata} → ${data.arrival_iata}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Search error:', error);
      let errorMessage = `No data found for flight ${cleanedFlightNumber}`;
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (error.response.status === 400) {
          errorMessage = error.response.data.message || 'Invalid request parameters';
        } else if (error.response.status === 404) {
          errorMessage = error.response.data.message || `Flight ${cleanedFlightNumber} not found`;
        } else {
          errorMessage = `Server error: ${error.response.status}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Flight Search Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  }, [flightNumber, token, searchDate, formatDate, getAuthHeaders, formatTime]);

  const handleSave = useCallback(async () => {
    if (!flightData.flightIata || !flightData.departureIata || !flightData.arrivalIata || !flightData.date) {
      Alert.alert('Error', 'Please fill in required fields:\n• Flight Number\n• Departure Airport\n• Arrival Airport\n• Date');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Authentication required. Please log in again.');
      return;
    }

    setIsSaving(true);
    
    try {
      const flightDate = new Date(flightData.date);
      const formattedDate = format(flightDate, 'yyyy-MM-dd');

      const saveData = {
        flight_iata: flightData.flightIata,
        flight_icao: flightData.flightIcao,
        flight_date: formattedDate,
        flight_status: flightData.status || 'scheduled',
        departure_airport: flightData.departureAirport,
        departure_iata: flightData.departureIata,
        departure_icao: flightData.departureIcao,
        departure_scheduled: flightData.departureTime 
          ? `${formattedDate} ${formatTimeForDB(flightData.departureTime)}`
          : null,
        arrival_airport: flightData.arrivalAirport,
        arrival_iata: flightData.arrivalIata,
        arrival_icao: flightData.arrivalIcao,
        arrival_scheduled: flightData.arrivalTime 
          ? `${formattedDate} ${formatTimeForDB(flightData.arrivalTime)}`
          : null,
        airline_name: flightData.airlineName,
        airline_iata: flightData.airlineIata,
        duration_hours: parseFloat(flightData.duration) || 0
      };

      console.log('Saving flight data:', saveData);
      
      const response = await axios.post(
        `${API_BASE_URL}/save-flight`, 
        saveData,
        { headers: getAuthHeaders() }
      );
      
      if (response.data?.success) {
        setShowModal(true);
      } else {
        Alert.alert('Error', 'Failed to save flight: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Save flight error:', error);
      
      let errorMessage = 'Failed to save flight. Please try again.';
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [flightData, token, formatTimeForDB, getAuthHeaders]);

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================
  const toggleMode = useCallback((newMode: Mode) => {
    setMode(newMode);
  }, []);

  const handleModalClose = useCallback((action: 'logbook' | 'another') => {
    setShowModal(false);
    action === 'logbook' ? router.push('/logs') : handleReset();
  }, [router, handleReset]);

  const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      updateField('date', formattedDate);
    }
  }, [updateField]);

  const handleSearchDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowSearchDatePicker(false);
    if (selectedDate) {
      setSearchDate(selectedDate);
    }
  }, []);

  // ========================================================================
  // EFFECTS
  // ========================================================================
  useEffect(() => {
    handleReset();
  }, [mode, handleReset]);

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
      color: '#fff',
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
    content: {
      flex: 1,
      padding: 16,
    },
    scrollContent: {
      paddingBottom: bottomSpacing + actionButtonHeight,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    inputGroup: {
      flex: 1,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dateInput: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dateText: {
      color: colors.text,
      fontSize: 16,
    },
    placeholderText: {
      color: colors.textSecondary,
      fontSize: 16,
    },
    searchBar: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    searchInput: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 14,
      fontSize: 16,
      color: colors.text,
      borderWidth: 2,
      borderColor: colors.border,
    },
    searchButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchDateContainer: {
      marginBottom: 10,
    },
    searchDateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 8,
    },
    loadingText: {
      color: colors.primary,
      fontStyle: 'italic',
    },
    button: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 10,
      gap: 8,
      minHeight: actionButtonHeight,
    },
    primaryButton: {
      backgroundColor: colors.primary,
    },
    secondaryButton: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    flightHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    routeText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
    },
    airlineText: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      margin: 20,
      width: '80%',
      maxWidth: 300,
      alignItems: 'center',
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    modalButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    actionButtons: {
      position: 'absolute',
      bottom: bottomSpacing,
      left: 20,
      right: 20,
      flexDirection: 'row',
      gap: 12,
      backgroundColor: colors.background,
      paddingTop: 12,
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
    modeToggleContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 4,
      marginBottom: 16,
    },
    modeButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    modeButtonActive: {
      backgroundColor: colors.primary,
    },
    modeButtonText: {
      fontWeight: '600',
      color: colors.textSecondary,
    },
    modeButtonTextActive: {
      color: '#fff',
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
            <Text style={styles.headerTitle}>Flight Data Finder</Text>
            <Text style={styles.headerSubtitle}>Authentication Required</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.authWarning}>
          <Text style={styles.authWarningText}>
            Please log in to access flight search and data entry features. 
            Authentication is required to save and retrieve flight information.
          </Text>
        </View>
      </View>
      
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
    </SafeAreaView>
  );

  const renderModeToggle = () => (
    <View style={styles.modeToggleContainer}>
      <TouchableOpacity
        style={[
          styles.modeButton,
          mode === 'autofill' && styles.modeButtonActive
        ]}
        onPress={() => toggleMode('autofill')}
      >
        <Text style={[
          styles.modeButtonText,
          mode === 'autofill' && styles.modeButtonTextActive
        ]}>
          Autofill
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.modeButton,
          mode === 'manual' && styles.modeButtonActive
        ]}
        onPress={() => toggleMode('manual')}
      >
        <Text style={[
          styles.modeButtonText,
          mode === 'manual' && styles.modeButtonTextActive
        ]}>
          Manual
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearchSection = () => (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>🔍 Flight Number Lookup</Text>
      
      <View style={styles.searchDateContainer}>
        <Text style={styles.inputLabel}>Search Date</Text>
        <TouchableOpacity 
          style={styles.searchDateButton}
          onPress={() => setShowSearchDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {formatDisplayDate(formatDate(searchDate))}
          </Text>
          <CalendarIcon size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
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
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={isLoading}
        >
          <Search color="#fff" size={24} />
        </TouchableOpacity>
      </View>
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Searching flight database...</Text>
        </View>
      )}
    </View>
  );

  const renderFlightInformation = () => (
    <View style={styles.card}>
      <View style={styles.flightHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Plane size={20} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>Flight Information</Text>
        </View>
        {flightData.departureIata && flightData.arrivalIata && (
          <Text style={styles.routeText}>
            {flightData.departureIata} → {flightData.arrivalIata}
          </Text>
        )}
      </View>

      {flightData.airlineName && (
        <Text style={styles.airlineText}>
          {flightData.airlineName} ({flightData.airlineIata}) • Status: {flightData.status}
        </Text>
      )}

      <View style={styles.row}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Flight Number *</Text>
          <TextInput
            style={styles.input}
            value={flightData.flightIata}
            onChangeText={(v) => updateField('flightIata', v)}
            autoCapitalize="characters"
            placeholder="AA123"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Date *</Text>
          <TouchableOpacity 
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={flightData.date ? styles.dateText : styles.placeholderText}>
              {formatDisplayDate(flightData.date) || 'Select Date'}
            </Text>
            <CalendarIcon size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Flight ICAO</Text>
          <TextInput
            style={styles.input}
            value={flightData.flightIcao}
            onChangeText={(v) => updateField('flightIcao', v)}
            autoCapitalize="characters"
            placeholder="AAL123"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Duration (hrs)</Text>
          <TextInput
            style={styles.input}
            value={flightData.duration}
            onChangeText={(v) => updateField('duration', v)}
            keyboardType="numeric"
            placeholder="2.5"
          />
        </View>
      </View>
    </View>
  );

  const renderAirportSection = (type: 'departure' | 'arrival') => {
    const isDeparture = type === 'departure';
    const title = isDeparture ? 'Departure' : 'Arrival';
    const airportField = isDeparture ? 'departureAirport' : 'arrivalAirport';
    const iataField = isDeparture ? 'departureIata' : 'arrivalIata';
    const icaoField = isDeparture ? 'departureIcao' : 'arrivalIcao';
    const timeField = isDeparture ? 'departureTime' : 'arrivalTime';
    const airportPlaceholder = isDeparture 
      ? 'John F. Kennedy International Airport' 
      : 'Los Angeles International Airport';
    const iataPlaceholder = isDeparture ? 'JFK' : 'LAX';
    const icaoPlaceholder = isDeparture ? 'KJFK' : 'KLAX';

    return (
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MapPin size={20} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Airport Name</Text>
            <TextInput
              style={styles.input}
              value={flightData[airportField]}
              onChangeText={(v) => updateField(airportField, v)}
              placeholder={airportPlaceholder}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>IATA Code *</Text>
            <TextInput
              style={styles.input}
              value={flightData[iataField]}
              onChangeText={(v) => updateField(iataField, v)}
              autoCapitalize="characters"
              placeholder={iataPlaceholder}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ICAO Code</Text>
            <TextInput
              style={styles.input}
              value={flightData[icaoField]}
              onChangeText={(v) => updateField(icaoField, v)}
              autoCapitalize="characters"
              placeholder={icaoPlaceholder}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Scheduled Time</Text>
            <TextInput
              style={styles.input}
              value={flightData[timeField]}
              onChangeText={(v) => updateField(timeField, v)}
              placeholder="HH:MM"
            />
          </View>
        </View>
      </View>
    );
  };

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]}
        onPress={handleReset}
      >
        <RotateCcw size={20} color={colors.text} />
        <Text style={[styles.buttonText, { color: colors.text }]}>
          Reset
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Save size={20} color="#fff" />
            <Text style={[styles.buttonText, { color: '#fff' }]}>
              Save Flight
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderSuccessModal = () => (
    <Modal
      visible={showModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <CheckCircle size={48} color={colors.primary} />
          <Text style={[styles.sectionTitle, { marginTop: 16, textAlign: 'center' }]}>
            Flight Saved!
          </Text>
          <Text style={{ 
            color: colors.textSecondary, 
            textAlign: 'center',
            marginVertical: 16,
            lineHeight: 22
          }}>
            Flight {flightData.flightIata} has been successfully saved.
          </Text>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.secondaryButton]}
              onPress={() => handleModalClose('another')}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>
                Add Another
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.primaryButton]}
              onPress={() => handleModalClose('logbook')}
            >
              <Text style={[styles.buttonText, { color: '#fff' }]}>
                View Flights
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ========================================================================
  // MAIN RENDER
  // ========================================================================
  if (!token) {
    return renderAuthWarning();
  }

  const shouldShowForm = mode === 'manual' || (mode === 'autofill' && flightData.flightIata);

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
            <Text style={styles.headerTitle}>Flight Data Finder</Text>
            <Text style={styles.headerSubtitle}>
              {mode === 'autofill' 
                ? 'Enter flight number to fetch flight details' 
                : 'Enter flight details manually'
              }
            </Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderModeToggle()}

        {mode === 'autofill' && renderSearchSection()}

        {shouldShowForm && (
          <>
            {renderFlightInformation()}
            {renderAirportSection('departure')}
            {renderAirportSection('arrival')}
          </>
        )}
      </ScrollView>

      {renderActionButtons()}

      {/* Date Pickers */}
      {showSearchDatePicker && (
        <DateTimePicker
          value={searchDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleSearchDateChange}
        />
      )}

      {showDatePicker && (
        <DateTimePicker
          value={flightData.date ? new Date(flightData.date) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {renderSuccessModal()}

      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
    </SafeAreaView>
  );
}