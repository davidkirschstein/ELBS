import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Clock, Plane, MapPin, Calendar, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface Flight {
  id: number;
  flight_iata: string;
  flight_date: string;
  departure_iata: string;
  arrival_iata: string;
  departure_scheduled: string;
  arrival_scheduled: string;
  airline_iata: string;
  duration_hours: number;
  flight_status: string;
  departure_airport: string;
  arrival_airport: string;
  departure_terminal?: string;
  departure_gate?: string;
  arrival_terminal?: string;
  arrival_gate?: string;
}

interface FlightCardProps {
  flight: Flight;
}

const FlightCard: React.FC<FlightCardProps> = ({ flight }) => {
  const { colors } = useTheme();

  const getDisplayValue = (value: any, fallback: string = 'N/A'): string => {
    return value && value !== null && value !== undefined ? String(value) : fallback;
  };

  const getStatusConfig = (status: string) => {
    const statusStr = String(status || '').toLowerCase();
    switch (statusStr) {
      case 'scheduled':
        return {
          color: '#f59e0b',
          icon: Clock,
          text: 'Scheduled',
          textColor: '#f59e0b'
        };
      case 'active':
        return {
          color: '#10b981',
          icon: CheckCircle,
          text: 'Active',
          textColor: '#10b981'
        };
      case 'cancelled':
        return {
          color: '#ef4444',
          icon: XCircle,
          text: 'Cancelled',
          textColor: '#ef4444'
        };
      case 'completed':
        return {
          color: '#3b82f6',
          icon: CheckCircle,
          text: 'Completed',
          textColor: '#3b82f6'
        };
      default:
        return {
          color: '#6b7280',
          icon: AlertCircle,
          text: statusStr || 'Unknown',
          textColor: '#6b7280'
        };
    }
  };

  const formatTime = (datetimeStr: string): string => {
    if (!datetimeStr) return '--:--';
    try {
      if (datetimeStr.includes('T')) {
        return datetimeStr.split('T')[1].substring(0, 5);
      }
      if (datetimeStr.includes(' ')) {
        return datetimeStr.split(' ')[1].substring(0, 5);
      }
      return datetimeStr.length >= 16 ? datetimeStr.substring(11, 16) : datetimeStr;
    } catch {
      return '--:--';
    }
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return 'Unknown Date';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  const formatDuration = (hours: number): string => {
    if (!hours || typeof hours !== 'number') return '--h --m';
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  const statusConfig = getStatusConfig(flight.flight_status);
  const StatusIcon = statusConfig.icon;

  const styles = StyleSheet.create({
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
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      marginBottom: 16,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    flightInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    airlineLogo: {
      width: 32,
      height: 32,
      marginRight: 12,
      borderRadius: 8,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    airlineLogoText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    flightDetails: {
      flex: 1,
    },
    flightNumber: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    flightDate: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
    },
    routeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    airportSection: {
      flex: 1,
      alignItems: 'center',
    },
    airportCode: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 4,
    },
    airportName: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    timeText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    flightPath: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    pathLine: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      marginBottom: 8,
    },
    pathDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: statusConfig.color,
    },
    pathLineInner: {
      flex: 1,
      height: 2,
      backgroundColor: colors.border,
      marginHorizontal: 8,
    },
    durationText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
      marginBottom: 4,
    },
    planeIcon: {
      backgroundColor: colors.primary + '20',
      padding: 6,
      borderRadius: 12,
    },
    detailsGrid: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    detailColumn: {
      flex: 1,
    },
    detailTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    detailLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    detailValue: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.text,
    },
    sourceText: {
      fontSize: 10,
      color: colors.textSecondary,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });

  const airlineCode = getDisplayValue(flight.airline_iata, 'AL');
  const flightNumber = getDisplayValue(flight.flight_iata, 'FLIGHT');
  const departureIata = getDisplayValue(flight.departure_iata, 'DEP');
  const arrivalIata = getDisplayValue(flight.arrival_iata, 'ARR');
  const departureAirport = getDisplayValue(flight.departure_airport, 'Departure Airport');
  const arrivalAirport = getDisplayValue(flight.arrival_airport, 'Arrival Airport');

  return (
    <View style={styles.flightCard}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.flightInfo}>
            <View style={styles.airlineLogo}>
              <Text style={styles.airlineLogoText}>
                {airlineCode.substring(0, 2)}
              </Text>
            </View>
            <View style={styles.flightDetails}>
              <Text style={styles.flightNumber}>
                {airlineCode} {flightNumber}
              </Text>
              <View style={styles.flightDate}>
                <Calendar size={12} color={colors.textSecondary} />
                <Text style={{ marginLeft: 4, fontSize: 13, color: colors.textSecondary }}>
                  {formatDate(flight.flight_date)}
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
            <StatusIcon size={12} color="#fff" />
            <Text style={styles.statusText}>
              {statusConfig.text.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Route Section */}
      <View style={styles.routeContainer}>
        <View style={styles.airportSection}>
          <Text style={styles.airportCode}>{departureIata}</Text>
          <Text style={styles.airportName} numberOfLines={2}>
            {departureAirport.replace(' Airport', '')}
          </Text>
          <Text style={styles.timeText}>
            {formatTime(flight.departure_scheduled)}
          </Text>
        </View>
        
        <View style={styles.flightPath}>
          <View style={styles.pathLine}>
            <View style={styles.pathDot} />
            <View style={styles.pathLineInner} />
            <View style={styles.pathDot} />
          </View>
          <Text style={styles.durationText}>
            {formatDuration(flight.duration_hours)}
          </Text>
          <View style={styles.planeIcon}>
            <Plane size={16} color={colors.primary} />
          </View>
        </View>
        
        <View style={styles.airportSection}>
          <Text style={styles.airportCode}>{arrivalIata}</Text>
          <Text style={styles.airportName} numberOfLines={2}>
            {arrivalAirport.replace(' Airport', '')}
          </Text>
          <Text style={styles.timeText}>
            {formatTime(flight.arrival_scheduled)}
          </Text>
        </View>
      </View>

      {/* Details Section */}
      <View style={styles.detailsGrid}>
        <View style={styles.detailColumn}>
          <View style={styles.detailTitle}>
            <MapPin size={14} color={colors.primary} />
            <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: '600', color: colors.text }}>
              Departure
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Terminal:</Text>
            <Text style={styles.detailValue}>
              {getDisplayValue(flight.departure_terminal, 'TBD')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Gate:</Text>
            <Text style={styles.detailValue}>
              {getDisplayValue(flight.departure_gate, '-')}
            </Text>
          </View>
        </View>
        
        <View style={styles.detailColumn}>
          <View style={styles.detailTitle}>
            <MapPin size={14} color="#10b981" />
            <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: '600', color: colors.text }}>
              Arrival
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Terminal:</Text>
            <Text style={styles.detailValue}>
              {getDisplayValue(flight.arrival_terminal, 'TBD')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Gate:</Text>
            <Text style={styles.detailValue}>
              {getDisplayValue(flight.arrival_gate, '-')}
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.sourceText}>
        Source: AviationStack • Updated recently
      </Text>
    </View>
  );
};

export default FlightCard;