import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  ActivityIndicator,
  TextInput,
  Dimensions
} from 'react-native';
import { Shield, User, Clock, FileText, Download, Filter, ChevronDown, ChevronUp, Plane, Calendar, MapPin, Menu, Search, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Info, Circle as XCircle, Database, Activity, Eye } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import axios from 'axios';

const { width } = Dimensions.get('window');

interface AuditLog {
  id: number;
  action: string;
  entity: string;
  entity_id: string;
  user_id: string;
  user_name: string;
  timestamp: string;
  details: any;
  flight_details: any;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function AuditScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupStatus, setBackupStatus] = useState('Healthy');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogs, setExpandedLogs] = useState<{[key: string]: boolean}>({});
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });
  const [error, setError] = useState<string | null>(null);
  const tabBarHeight = Platform.OS === 'ios' ? 85 : 70;

  useEffect(() => {
    fetchAuditLogs();
  }, [filter, pagination.currentPage, token]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get(
        'http://192.168.36.138:5000/audit-logs',
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          params: {
            page: pagination.currentPage,
            limit: pagination.itemsPerPage,
            filter: filter
          },
          timeout: 10000
        }
      );
      
      setAuditLogs(response.data.logs || []);
      setPagination(response.data.pagination || pagination);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch audit logs');
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const performBackup = async () => {
    setBackupLoading(true);
    setBackupStatus('Backing up...');
    
    try {
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.post(
        'http://192.168.36.138:5000/perform-backup',
        {},
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      
      if (response.data.success) {
        setBackupStatus('Backup completed');
        // Refresh audit logs to show the backup entry
        fetchAuditLogs();
        setTimeout(() => setBackupStatus('Healthy'), 3000);
      } else {
        throw new Error(response.data.message || 'Backup failed');
      }
    } catch (error: any) {
      console.error('Backup error:', error);
      setBackupStatus('Backup failed');
      setTimeout(() => setBackupStatus('Healthy'), 5000);
    } finally {
      setBackupLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedLogs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
      case 'logout':
      case 'registered':
        return User;
      case 'created':
      case 'flight_added': 
      case 'flight_updated': 
        return Plane;
      case 'schedule_modified': 
        return Clock;
      case 'backup':
      case 'backup_completed':
      case 'backup_manual': 
        return Download;
      case 'data_export': 
        return FileText;
      case 'analytics_viewed':
        return Eye;
      default: 
        return Activity;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
      case 'registered':
      case 'created':
      case 'backup_completed':
      case 'backup':
        return '#10b981'; // Green
      case 'logout':
      case 'data_export':
      case 'analytics_viewed':
        return colors.primary; // Blue
      case 'flight_updated':
      case 'schedule_modified':
        return '#f59e0b'; // Orange
      case 'error':
      case 'failed':
        return '#ef4444'; // Red
      default: 
        return '#6b7280'; // Gray
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.user_name.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.entity.toLowerCase().includes(query) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(query))
      );
    }
    return true;
  });

  const AuditLogCard = ({ log }: { log: AuditLog }) => {
    const Icon = getActionIcon(log.action);
    const isExpanded = expandedLogs[log.id.toString()];
    const actionColor = getActionColor(log.action);
    
    return (
      <TouchableOpacity 
        style={[styles.logCard, { borderLeftColor: actionColor }]}
        onPress={() => toggleExpand(log.id.toString())}
      >
        <View style={styles.logHeader}>
          <View style={[styles.iconContainer, { backgroundColor: actionColor + '20' }]}>
            <Icon color={actionColor} size={20} />
          </View>
          <View style={styles.logInfo}>
            <Text style={styles.logAction}>{log.action.replace(/_/g, ' ').toUpperCase()}</Text>
            <Text style={styles.logTimestamp}>{formatTimestamp(log.timestamp)}</Text>
          </View>
          <View style={styles.expandIcon}>
            {isExpanded ? (
              <ChevronUp color={colors.textSecondary} size={20} />
            ) : (
              <ChevronDown color={colors.textSecondary} size={20} />
            )}
          </View>
        </View>
        
        <Text style={styles.logDetails}>
          {log.details?.message || `${log.action} performed on ${log.entity}`}
        </Text>
        <View style={styles.logMeta}>
          <Text style={styles.logUser}>By: {log.user_name}</Text>
          <Text style={styles.logEntity}>Entity: {log.entity}</Text>
        </View>
        
        {isExpanded && (
          <View style={styles.expandedContent}>
            {log.flight_details && (
              <View style={styles.flightDetails}>
                <Text style={styles.detailsTitle}>Flight Details</Text>
                {log.flight_details.flight_iata && (
                  <View style={styles.detailRow}>
                    <Plane size={16} color={colors.primary} />
                    <Text style={styles.detailLabel}>
                      Flight: {log.flight_details.flight_iata}
                    </Text>
                  </View>
                )}
                {log.flight_details.departure_iata && log.flight_details.arrival_iata && (
                  <View style={styles.detailRow}>
                    <MapPin size={16} color={colors.primary} />
                    <Text style={styles.detailLabel}>
                      Route: {log.flight_details.departure_iata} → {log.flight_details.arrival_iata}
                    </Text>
                  </View>
                )}
                {log.flight_details.flight_date && (
                  <View style={styles.detailRow}>
                    <Calendar size={16} color={colors.primary} />
                    <Text style={styles.detailLabel}>
                      Date: {log.flight_details.flight_date}
                    </Text>
                  </View>
                )}
                {log.flight_details.duration_hours && (
                  <View style={styles.detailRow}>
                    <Clock size={16} color={colors.primary} />
                    <Text style={styles.detailLabel}>
                      Duration: {log.flight_details.duration_hours} hours
                    </Text>
                  </View>
                )}
              </View>
            )}
            
            <View style={styles.technicalDetails}>
              <Text style={styles.detailsTitle}>Technical Details</Text>
              <View style={styles.detailRow}>
                <Database size={16} color={colors.textSecondary} />
                <Text style={styles.detailLabel}>Entity ID: {log.entity_id}</Text>
              </View>
              <View style={styles.detailRow}>
                <User size={16} color={colors.textSecondary} />
                <Text style={styles.detailLabel}>User ID: {log.user_id}</Text>
              </View>
              <View style={styles.detailRow}>
                <Clock size={16} color={colors.textSecondary} />
                <Text style={styles.detailLabel}>
                  Full Timestamp: {new Date(log.timestamp).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const BackupStatusCard = () => (
    <View style={styles.backupCard}>
      <View style={styles.backupHeader}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <Download color={colors.primary} size={24} />
        </View>
        <Text style={styles.backupTitle}>Data Backup & Recovery</Text>
      </View>
      
      <View style={styles.backupStatus}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={[styles.statusText, { 
          color: backupStatus === 'Healthy' ? '#10b981' : 
                backupStatus.includes('failed') ? '#ef4444' : '#f59e0b' 
        }]}>
          {backupStatus}
        </Text>
      </View>
      
      <Text style={styles.backupDescription}>
        Automatic backups run daily at 3:00 AM. Manual backups can be triggered anytime.
      </Text>
      
      <TouchableOpacity 
        style={[styles.backupButton, backupLoading && styles.backupButtonDisabled]}
        onPress={performBackup}
        disabled={backupLoading}
      >
        {backupLoading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.backupButtonText}>Manual Backup</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.primary,
      padding: 16,
      paddingTop: 50,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
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
      opacity: 0.9,
      textAlign: 'center',
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
    },
    errorContainer: {
      backgroundColor: '#fee2e2',
      padding: 16,
      borderRadius: 8,
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: '#ef4444',
    },
    errorText: {
      color: '#dc2626',
      fontSize: 14,
      fontWeight: '500',
    },
    backupCard: {
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
    backupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    backupTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 12,
    },
    backupStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    statusLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginRight: 8,
    },
    statusText: {
      fontSize: 14,
      fontWeight: '600',
    },
    backupDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    backupButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
    },
    backupButtonDisabled: {
      opacity: 0.6,
    },
    backupButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#ffffff',
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
    },
    searchContainer: {
      backgroundColor: colors.card,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      marginLeft: 8,
    },
    filterButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 16,
      gap: 8,
    },
    filterButton: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    filterButtonTextActive: {
      color: '#ffffff',
    },
    logCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 4,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    logHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logInfo: {
      marginLeft: 12,
      flex: 1,
    },
    expandIcon: {
      marginLeft: 8,
    },
    logAction: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    logTimestamp: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    logDetails: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      lineHeight: 20,
    },
    logMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    logUser: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    logEntity: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    expandedContent: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    flightDetails: {
      marginBottom: 16,
    },
    technicalDetails: {
      marginTop: 8,
    },
    detailsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    detailLabel: {
      fontSize: 13,
      marginLeft: 8,
      color: colors.text,
      flex: 1,
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    summaryCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      flex: 1,
      minWidth: '45%',
      alignItems: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginTop: 8,
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16,
      paddingHorizontal: 16,
    },
    paginationButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    paginationButtonDisabled: {
      backgroundColor: colors.surface,
    },
    paginationButtonText: {
      color: '#ffffff',
      fontWeight: '600',
    },
    paginationButtonTextDisabled: {
      color: colors.textSecondary,
    },
    paginationInfo: {
      fontSize: 14,
      color: colors.textSecondary,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <TouchableOpacity 
                style={styles.menuButton}
                onPress={() => setSidebarVisible(true)}
              >
                <Menu size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Audit & Security</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>System activity monitoring and data backup</Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading audit logs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setSidebarVisible(true)}
            >
              <Menu size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Audit & Security</Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>System activity monitoring and data backup</Text>
      </View>
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
      >
        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Backup Status Card */}
        <BackupStatusCard />

        {/* Audit Logs Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Audit Trail</Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search audit logs..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Filter Buttons */}
          <View style={styles.filterButtons}>
            {['all', 'pilot', 'flight', 'system'].map((filterType) => (
              <TouchableOpacity
                key={filterType}
                style={[
                  styles.filterButton,
                  filter === filterType && styles.filterButtonActive
                ]}
                onPress={() => setFilter(filterType)}
              >
                <Text style={[
                  styles.filterButtonText,
                  filter === filterType && styles.filterButtonTextActive
                ]}>
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Audit Logs List */}
          {filteredLogs.length > 0 ? (
            <>
              {filteredLogs.map((log) => (
                <AuditLogCard key={log.id} log={log} />
              ))}
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <View style={styles.paginationContainer}>
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      pagination.currentPage === 1 && styles.paginationButtonDisabled
                    ]}
                    onPress={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                    disabled={pagination.currentPage === 1}
                  >
                    <Text style={[
                      styles.paginationButtonText,
                      pagination.currentPage === 1 && styles.paginationButtonTextDisabled
                    ]}>
                      Previous
                    </Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.paginationInfo}>
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </Text>
                  
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      pagination.currentPage === pagination.totalPages && styles.paginationButtonDisabled
                    ]}
                    onPress={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                    disabled={pagination.currentPage === pagination.totalPages}
                  >
                    <Text style={[
                      styles.paginationButtonText,
                      pagination.currentPage === pagination.totalPages && styles.paginationButtonTextDisabled
                    ]}>
                      Next
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Shield color={colors.textSecondary} size={48} />
              <Text style={styles.emptyText}>
                {searchQuery ? `No logs match "${searchQuery}"` : 'No audit logs found'}
              </Text>
            </View>
          )}
        </View>

        {/* Security Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Activity size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Security Summary</Text>
          </View>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <User color="#10b981" size={24} />
              <Text style={styles.summaryValue}>1</Text>
              <Text style={styles.summaryLabel}>Active Users</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <Shield color={colors.primary} size={24} />
              <Text style={styles.summaryValue}>{pagination.totalItems}</Text>
              <Text style={styles.summaryLabel}>Total Events</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <Download color="#f59e0b" size={24} />
              <Text style={styles.summaryValue}>Daily</Text>
              <Text style={styles.summaryLabel}>Backup Schedule</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <Clock color="#8b5cf6" size={24} />
              <Text style={styles.summaryValue}>30d</Text>
              <Text style={styles.summaryLabel}>Log Retention</Text>
            </View>
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