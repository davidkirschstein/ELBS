import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Button
} from 'react-native';
import { 
  ChevronLeft,
  Upload,
  Bell,
  FileText
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';

export default function ScheduleUploadScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const navigation = useNavigation();

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
      paddingTop: 20,
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
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
      backgroundColor: colors.surface || colors.card,
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
    emptyState: {
      alignItems: 'center',
      padding: 20,
    },
    emptyStateText: {
      marginTop: 10,
      color: colors.textSecondary,
      fontSize: 16,
    },
    scheduleText: {
      flex: 1,
    },
    scheduleTitle: {
      fontWeight: '600',
      color: colors.text,
      fontSize: 16,
      marginBottom: 4,
    },
    scheduleDetails: {
      color: colors.textSecondary,
      fontSize: 14,
    },
  });

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFile(result.assets[0]);
      }
    } catch (err) {
      console.error('File picker error:', err);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      Alert.alert('Error', 'Please select a file first');
      return;
    }
    
    if (!token) {
      Alert.alert('Error', 'Authentication required. Please log in again.');
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
        setFile(null); // Clear selected file
        fetchSchedules(); // Refresh schedules
      } else {
        Alert.alert('Error', response.data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('Error', 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const fetchSchedules = async () => {
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
  };

  useEffect(() => {
    fetchSchedules();
  }, [token]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={32} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Schedule</Text>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
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
          
          <TouchableOpacity
            style={[
              styles.uploadButton,
              (!file || uploading) && { opacity: 0.6 }
            ]}
            onPress={handleFileUpload}
            disabled={!file || uploading}
          >
            <Upload size={20} color="#fff" />
            <Text style={styles.uploadButtonText}>
              {uploading ? "Processing..." : "Upload Schedule"}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Upcoming Flights</Text>
          
          {Array.isArray(schedules) && schedules.length > 0 ? (
            schedules.map((schedule) => (
              <View key={schedule.id} style={styles.scheduleItem}>
                <View style={styles.scheduleIcon}>
                  <Bell size={20} color={colors.primary} />
                </View>
                <View style={styles.scheduleText}>
                  <Text style={styles.scheduleTitle}>
                    {schedule.flight_number} • {schedule.flight_name}
                  </Text>
                  <Text style={styles.scheduleDetails}>
                    {schedule.flight_date} at {schedule.flight_time}
                    {schedule.standby_time && ` • Standby at ${schedule.standby_time}`}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <FileText size={40} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>
                No scheduled flights
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}