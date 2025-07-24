import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { AviationStackService, FlightData } from '@/services/aviationStackApi';
import { Plane, MapPin } from 'lucide-react-native';

interface FlightDataFormProps {
  onFlightDataFetched: (data: FlightData) => void;
}

export default function FlightDataForm({ onFlightDataFetched }: FlightDataFormProps) {
  const [flightNumber, setFlightNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchFlightData = async () => {
    if (!flightNumber.trim()) {
      Alert.alert('Error', 'Please enter a flight number');
      return;
    }

    setLoading(true);
    try {
      const flightData = await AviationStackService.getFlightByNumber(flightNumber.trim());
      
      if (flightData) {
        onFlightDataFetched(flightData);
        Alert.alert('Success', 'Flight data retrieved from AviationStack API');
      } else {
        Alert.alert('Not Found', 'Flight not found in AviationStack database');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch flight data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auto-Fill Flight Data</Text>
      <Text style={styles.subtitle}>Enter flight number to auto-populate from AviationStack API</Text>
      
      <View style={styles.inputContainer}>
        <Plane color="#6B7280" size={20} />
        <TextInput
          style={styles.input}
          placeholder="Flight Number (e.g., AA1234)"
          value={flightNumber}
          onChangeText={setFlightNumber}
          autoCapitalize="characters"
        />
      </View>
      
      <TouchableOpacity 
        style={[styles.fetchButton, loading && styles.fetchButtonDisabled]}
        onPress={fetchFlightData}
        disabled={loading}
      >
        <MapPin color="white" size={16} />
        <Text style={styles.fetchButtonText}>
          {loading ? 'Fetching...' : 'Auto-Fill from API'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EBF8FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E40AF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  fetchButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fetchButtonDisabled: {
    opacity: 0.6,
  },
  fetchButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 6,
  },
});