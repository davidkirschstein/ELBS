import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import { 
  Plane, 
  Clock, 
  MapPin, 
  AlertCircle, 
  CheckCircle, 
  PlayCircle, 
  XCircle,
  Calendar,
  Users,
  Wifi,
  Coffee,
  Monitor,
  Star,
  ArrowRight,
  Navigation
} from 'lucide-react-native';

interface Flight {
  id: number;
  flight_iata: string;
  flight_date: string;
  departure_iata: string;
  arrival_iata: string;
  departure_scheduled: string;
  arrival_scheduled: string;
  airline_iata: string;
  airline_name: string;
  duration_hours: number;
  flight_status: string;
  departure_airport: string;
  arrival_airport: string;
  departure_terminal?: string;
  departure_gate?: string;
  arrival_terminal?: string;
  arrival_gate?: string;
  flight_number?: string;
}

interface DetailedFlightCardProps {
  flight: Flight;
  onSave?: (flight: Flight) => void;
  colors: any;
}

const { width } = Dimensions.get('window');

export const DetailedFlightCard: React.FC<DetailedFlightCardProps> = ({ 
  flight, 
  onSave,
  colors 
}) => {
  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return 'N/A';
    }
  };

  const formatDuration = (hours: number) => {
    if (!hours || hours === 0) return 'N/A';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return { color: '#3B82F6', bgColor: '#EBF8FF', icon: Clock, text: 'Scheduled' };
      case 'active':
      case 'en-route':
        return { color: '#10B981', bgColor: '#F0FDF4', icon: PlayCircle, text: 'Active' };
      case 'completed':
      case 'landed':
        return { color: '#6B7280', bgColor: '#F9FAFB', icon: CheckCircle, text: 'Completed' };
      case 'cancelled':
        return { color: '#EF4444', bgColor: '#FEF2F2', icon: XCircle, text: 'Cancelled' };
      case 'delayed':
        return { color: '#F59E0B', bgColor: '#FFFBEB', icon: AlertCircle, text: 'Delayed' };
      default:
        return { color: '#6B7280', bgColor: '#F9FAFB', icon: Clock, text: status };
    }
  };

  const getAirlineRating = () => {
    const ratings: { [key: string]: number } = {
      'AA': 4.2, 'DL': 4.5, 'UA': 4.1, 'SW': 4.3, 'BA': 4.6,
      'QR': 4.8, 'EK': 4.7, 'LH': 4.4
    };
    return ratings[flight.airline_iata] || 4.0;
  };

  const getAircraftType = () => {
    const aircraft = ['Boeing 737-800', 'Airbus A320', 'Boeing 777-300ER', 'Airbus A350', 'Boeing 787-9'];
    return aircraft[Math.floor(Math.random() * aircraft.length)];
  };

  const getFlightAmenities = () => {
    return [
      { icon: Wifi, label: 'WiFi', available: Math.random() > 0.3 },
      { icon: Coffee, label: 'Meals', available: Math.random() > 0.2 },
      { icon: Monitor, label: 'Entertainment', available: Math.random() > 0.4 },
      { icon: Users, label: 'Extra Legroom', available: Math.random() > 0.6 }
    ];
  };

  const statusConfig = getStatusConfig(flight.flight_status);
  const StatusIcon = statusConfig.icon;
  const amenities = getFlightAmenities();
  const rating = getAirlineRating();
  const aircraft = getAircraftType();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 20,
      marginBottom: 16,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      overflow: 'hidden',
    },
    header: {
      backgroundColor: colors.primary,
      padding: 20,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    airlineSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    airlineIcon: {
      width: 48,
      height: 48,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    airlineInfo: {
      flex: 1,
    },
    flightNumber: {
      fontSize: 20,
      fontWeight: '800',
      color: '#fff',
    },
    airlineName: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.9)',
      marginTop: 2,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    ratingText: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
      marginLeft: 4,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 6,
    },
    routeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    airportSection: {
      alignItems: 'center',
      flex: 1,
    },
    airportCode: {
      fontSize: 28,
      fontWeight: '800',
      color: '#fff',
    },
    airportName: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
      marginTop: 4,
      maxWidth: 80,
    },
    flightPath: {
      flex: 1,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    pathLine: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
    },
    pathSegment: {
      flex: 1,
      height: 2,
      backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    pathIcon: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      padding: 8,
      borderRadius: 20,
      marginHorizontal: 8,
    },
    durationContainer: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    durationText: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
      marginLeft: 4,
    },
    detailsSection: {
      padding: 20,
    },
    timesContainer: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    timeCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 4,
    },
    timeCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    timeCardTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
    },
    timeDetail: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    timeLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    timeValue: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    aircraftSection: {
      backgroundColor: `${colors.primary}10`,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    aircraftHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    aircraftTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
    },
    aircraftGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    aircraftInfo: {
      flex: 1,
    },
    aircraftLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    aircraftValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    amenitiesContainer: {
      flex: 1,
      marginLeft: 16,
    },
    amenitiesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    amenityChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginBottom: 4,
    },
    amenityAvailable: {
      backgroundColor: '#10B981',
    },
    amenityUnavailable: {
      backgroundColor: colors.border,
    },
    amenityText: {
      fontSize: 10,
      fontWeight: '600',
      marginLeft: 4,
    },
    amenityTextAvailable: {
      color: '#fff',
    },
    amenityTextUnavailable: {
      color: colors.textSecondary,
    },
    statsContainer: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      alignItems: 'center',
      padding: 12,
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginHorizontal: 4,
    },
    statIcon: {
      marginBottom: 8,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    statLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 2,
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.airlineSection}>
            <View style={styles.airlineIcon}>
              <Plane color="#fff" size={24} />
            </View>
            <View style={styles.airlineInfo}>
              <Text style={styles.flightNumber}>
                {flight.flight_iata || `${flight.airline_iata}${flight.flight_number}`}
              </Text>
              <Text style={styles.airlineName}>{flight.airline_name}</Text>
              <View style={styles.ratingContainer}>
                <Star color="#FCD34D" size={12} />
                <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.statusBadge}>
            <StatusIcon color="#fff" size={14} />
            <Text style={styles.statusText}>{statusConfig.text}</Text>
          </View>
        </View>

        {/* Route Section */}
        <View style={styles.routeContainer}>
          <View style={styles.airportSection}>
            <Text style={styles.airportCode}>{flight.departure_iata}</Text>
            <Text style={styles.airportName}>
              {flight.departure_airport?.replace(' Airport', '') || 'Departure'}
            </Text>
          </View>

          <View style={styles.flightPath}>
            <View style={styles.pathLine}>
              <View style={styles.pathSegment} />
              <View style={styles.pathIcon}>
                <ArrowRight color="#fff" size={16} />
              </View>
              <View style={styles.pathSegment} />
            </View>
            <View style={styles.durationContainer}>
              <Clock color="rgba(255, 255, 255, 0.8)" size={12} />
              <Text style={styles.durationText}>{formatDuration(flight.duration_hours)}</Text>
            </View>
          </View>

          <View style={styles.airportSection}>
            <Text style={styles.airportCode}>{flight.arrival_iata}</Text>
            <Text style={styles.airportName}>
              {flight.arrival_airport?.replace(' Airport', '') || 'Arrival'}
            </Text>
          </View>
        </View>
      </View>

      {/* Details Section */}
      <View style={styles.detailsSection}>
        {/* Flight Times */}
        <View style={styles.timesContainer}>
          <View style={styles.timeCard}>
            <View style={styles.timeCardHeader}>
              <Navigation color={colors.primary} size={16} />
              <Text style={styles.timeCardTitle}>Departure</Text>
            </View>
            <View style={styles.timeDetail}>
              <Text style={styles.timeLabel}>Scheduled:</Text>
              <Text style={styles.timeValue}>{formatTime(flight.departure_scheduled)}</Text>
            </View>
            {flight.departure_terminal && (
              <View style={styles.timeDetail}>
                <Text style={styles.timeLabel}>Terminal:</Text>
                <Text style={styles.timeValue}>{flight.departure_terminal}</Text>
              </View>
            )}
            {flight.departure_gate && (
              <View style={styles.timeDetail}>
                <Text style={styles.timeLabel}>Gate:</Text>
                <Text style={styles.timeValue}>{flight.departure_gate}</Text>
              </View>
            )}
          </View>

          <View style={styles.timeCard}>
            <View style={styles.timeCardHeader}>
              <MapPin color="#10B981" size={16} />
              <Text style={styles.timeCardTitle}>Arrival</Text>
            </View>
            <View style={styles.timeDetail}>
              <Text style={styles.timeLabel}>Scheduled:</Text>
              <Text style={styles.timeValue}>{formatTime(flight.arrival_scheduled)}</Text>
            </View>
            {flight.arrival_terminal && (
              <View style={styles.timeDetail}>
                <Text style={styles.timeLabel}>Terminal:</Text>
                <Text style={styles.timeValue}>{flight.arrival_terminal}</Text>
              </View>
            )}
            {flight.arrival_gate && (
              <View style={styles.timeDetail}>
                <Text style={styles.timeLabel}>Gate:</Text>
                <Text style={styles.timeValue}>{flight.arrival_gate}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Aircraft & Amenities */}
        <View style={styles.aircraftSection}>
          <View style={styles.aircraftHeader}>
            <Plane color={colors.primary} size={16} />
            <Text style={styles.aircraftTitle}>Aircraft & Services</Text>
          </View>
          <View style={styles.aircraftGrid}>
            <View style={styles.aircraftInfo}>
              <Text style={styles.aircraftLabel}>Aircraft Type:</Text>
              <Text style={styles.aircraftValue}>{aircraft}</Text>
            </View>
            <View style={styles.amenitiesContainer}>
              <Text style={styles.aircraftLabel}>Services:</Text>
              <View style={styles.amenitiesGrid}>
                {amenities.map((amenity, index) => {
                  const AmenityIcon = amenity.icon;
                  return (
                    <View
                      key={index}
                      style={[
                        styles.amenityChip,
                        amenity.available ? styles.amenityAvailable : styles.amenityUnavailable
                      ]}
                    >
                      <AmenityIcon 
                        color={amenity.available ? '#fff' : colors.textSecondary} 
                        size={10} 
                      />
                      <Text 
                        style={[
                          styles.amenityText,
                          amenity.available ? styles.amenityTextAvailable : styles.amenityTextUnavailable
                        ]}
                      >
                        {amenity.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Calendar color={colors.primary} size={20} style={styles.statIcon} />
            <Text style={styles.statValue}>{new Date(flight.flight_date).getDate()}</Text>
            <Text style={styles.statLabel}>Flight Date</Text>
          </View>
          <View style={styles.statCard}>
            <Clock color="#10B981" size={20} style={styles.statIcon} />
            <Text style={styles.statValue}>{formatDuration(flight.duration_hours)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statCard}>
            <Star color="#F59E0B" size={20} style={styles.statIcon} />
            <Text style={styles.statValue}>{rating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Save Button */}
        {onSave && (
          <TouchableOpacity style={styles.saveButton} onPress={() => onSave(flight)}>
            <Star color="#fff" size={16} />
            <Text style={styles.saveButtonText}>Save to Logbook</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};