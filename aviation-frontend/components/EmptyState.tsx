// components/EmptyState

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Plane, Search, Calendar } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface EmptyStateProps {
  type: 'no-flights' | 'no-search-results';
  date?: string;
  flightNumber?: string;
  onReset?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, date, flightNumber, onReset }) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
    },
    iconContainer: {
      width: 64,
      height: 64,
      backgroundColor: colors.surface,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    message: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 24,
      textAlign: 'center',
    },
    boldText: {
      fontWeight: '600',
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
  });

  if (type === 'no-search-results') {
    return (
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Search size={32} color={colors.textSecondary} />
        </View>
        <Text style={styles.title}>No flights found</Text>
        <Text style={styles.message}>
          No flights found for <Text style={styles.boldText}>{flightNumber}</Text> on{' '}
          <Text style={styles.boldText}>{date}</Text>
        </Text>
        {onReset && (
          <TouchableOpacity style={styles.button} onPress={onReset}>
            <Calendar size={20} color="#fff" />
            <Text style={styles.buttonText}>Show all flights</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Plane size={32} color={colors.textSecondary} />
      </View>
      <Text style={styles.title}>No flights scheduled</Text>
      <Text style={styles.message}>
        No flights scheduled for <Text style={styles.boldText}>{date}</Text>
      </Text>
    </View>
  );
};

export default EmptyState;