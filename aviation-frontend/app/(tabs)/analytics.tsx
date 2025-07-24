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
  Dimensions
} from 'react-native';
import Svg, { Line, Circle, G, Text as SvgText, Path, Rect } from 'react-native-svg';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Plane, 
  Target, 
  Brain, 
  Menu,
  MapPin,
  CheckCircle,
  XCircle,
  Zap,
  Award
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import axios from 'axios';

const { width } = Dimensions.get('window');

interface FlightAnalytics {
  totalFlights: number;
  totalHours: number;
  averageFlightTime: number;
  mostFrequentRoute: string;
  mostUsedAircraft: string;
  onTimePercentage: number;
  monthlyTrend: Array<{ month: string; flights: number; hours: number }>;
  aircraftBreakdown: Array<{ type: string; count: number; hours: number; percentage: number }>;
  routeAnalysis: Array<{ route: string; frequency: number; avgDuration: number }>;
  statusDistribution: { scheduled: number; active: number; completed: number; cancelled: number };
  timeDistribution: { day: number; night: number; ifr: number; crossCountry: number };
  airlineAnalysis: Array<{ airline: string; flights: number; reliability: number }>;
}

export default function Analytics() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [analytics, setAnalytics] = useState<FlightAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const tabBarHeight = Platform.OS === 'ios' ? 85 : 70;

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod, token]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get(
        'http://192.168.36.138:5000/analytics',
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      setAnalytics(response.data);
      generateInsights(response.data);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch analytics');
      
      // Set empty analytics state on error
      const emptyAnalytics: FlightAnalytics = {
        totalFlights: 0,
        totalHours: 0,
        averageFlightTime: 0,
        mostFrequentRoute: 'N/A',
        mostUsedAircraft: 'N/A',
        onTimePercentage: 0,
        monthlyTrend: [],
        aircraftBreakdown: [],
        routeAnalysis: [],
        statusDistribution: { scheduled: 0, active: 0, completed: 0, cancelled: 0 },
        timeDistribution: { day: 0, night: 0, ifr: 0, crossCountry: 0 },
        airlineAnalysis: []
      };
      setAnalytics(emptyAnalytics);
      generateInsights(emptyAnalytics);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (data: FlightAnalytics) => {
    const insights = [];
    
    if (data.totalFlights === 0) {
      insights.push('No flight data available. Start logging flights to generate insights.');
      setInsights(insights);
      return;
    }
    
    if (data.onTimePercentage > 90) {
      insights.push(`Excellent on-time performance at ${data.onTimePercentage.toFixed(1)}%. Your flight operations are highly reliable.`);
    } else if (data.onTimePercentage > 80) {
      insights.push(`Good on-time performance at ${data.onTimePercentage.toFixed(1)}%. Consider optimizing scheduling for better efficiency.`);
    } else {
      insights.push(`On-time performance needs improvement at ${data.onTimePercentage.toFixed(1)}%. Review operational procedures.`);
    }

    if (data.aircraftBreakdown.length > 0) {
      const topAircraft = data.aircraftBreakdown[0];
      insights.push(`${topAircraft.type} dominates your fleet usage (${topAircraft.percentage.toFixed(1)}%). Consider diversifying for operational flexibility.`);
    }

    if (data.averageFlightTime > 3) {
      insights.push(`Your average flight time of ${data.averageFlightTime.toFixed(1)} hours indicates focus on long-haul operations. Excellent for building cross-country experience.`);
    } else if (data.averageFlightTime > 0) {
      insights.push(`Short to medium-haul focus with ${data.averageFlightTime.toFixed(1)} hour average flights. Great for frequency and quick turnarounds.`);
    }

    if (data.totalHours > 0 && data.timeDistribution.night / data.totalHours > 0.3) {
      insights.push(`Strong night flying experience (${((data.timeDistribution.night / data.totalHours) * 100).toFixed(1)}%). Excellent for maintaining night currency.`);
    } else if (data.totalHours > 0) {
      insights.push(`Consider increasing night flying hours to maintain proficiency. Currently at ${((data.timeDistribution.night / data.totalHours) * 100).toFixed(1)}%.`);
    }

    // Add trend insights
    if (data.monthlyTrend.length > 1) {
      const recentMonths = data.monthlyTrend.slice(-2);
      const flightTrend = recentMonths[1].flights - recentMonths[0].flights;
      if (flightTrend > 0) {
        insights.push(`Flight activity is increasing! You flew ${flightTrend} more flights last month compared to the previous month.`);
      } else if (flightTrend < 0) {
        insights.push(`Flight activity decreased by ${Math.abs(flightTrend)} flights last month. Consider planning more flights to maintain proficiency.`);
      }
    }

    setInsights(insights);
  };

  const renderEnhancedBarChart = (data: any[], maxFlights: number, maxHours: number) => {
    if (!data || data.length === 0) {
      return (
        <View style={styles.emptyChartContainer}>
          <Text style={styles.emptyChartText}>No flight data available</Text>
        </View>
      );
    }

    const chartHeight = 180;
    const chartWidth = width - 60;
    const barWidth = (chartWidth - 40) / data.length / 2 - 4;
    const spacing = 8;

    return (
      <View style={styles.enhancedChartContainer}>
        <Svg width={chartWidth} height={chartHeight + 40}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <Line
              key={i}
              x1="20"
              y1={20 + chartHeight * ratio}
              x2={chartWidth - 20}
              y2={20 + chartHeight * ratio}
              stroke={colors.border}
              strokeWidth="0.5"
              strokeDasharray="3, 3"
            />
          ))}

          {/* Bars and labels */}
          {data.map((item, index) => {
            const x = 30 + index * ((chartWidth - 60) / data.length);
            const flightHeight = maxFlights > 0 ? (item.flights / maxFlights) * chartHeight : 0;
            const hoursHeight = maxHours > 0 ? (item.hours / maxHours) * chartHeight : 0;

            return (
              <G key={index}>
                {/* Flight bars */}
                <Rect
                  x={x - barWidth - 2}
                  y={20 + chartHeight - flightHeight}
                  width={barWidth}
                  height={Math.max(flightHeight, 2)}
                  fill={colors.primary}
                  rx="2"
                />
                
                {/* Hours bars */}
                <Rect
                  x={x + 2}
                  y={20 + chartHeight - hoursHeight}
                  width={barWidth}
                  height={Math.max(hoursHeight, 2)}
                  fill="#10b981"
                  rx="2"
                />

                {/* Values on top of bars */}
                <SvgText
                  x={x - barWidth/2 - 2}
                  y={15 + chartHeight - flightHeight}
                  textAnchor="middle"
                  fontSize="10"
                  fill={colors.text}
                  fontWeight="bold"
                >
                  {item.flights}
                </SvgText>

                <SvgText
                  x={x + barWidth/2 + 2}
                  y={15 + chartHeight - hoursHeight}
                  textAnchor="middle"
                  fontSize="10"
                  fill={colors.text}
                  fontWeight="bold"
                >
                  {item.hours.toFixed(1)}
                </SvgText>

                {/* Month labels */}
                <SvgText
                  x={x}
                  y={chartHeight + 35}
                  textAnchor="middle"
                  fontSize="12"
                  fill={colors.text}
                  fontWeight="500"
                >
                  {item.month}
                </SvgText>
              </G>
            );
          })}
        </Svg>

        {/* Legend */}
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>Flights</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Hours</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderLineChart = (data: any[], valueKey: 'flights' | 'hours', maxValue: number, color: string) => {
    if (!data || data.length === 0 || maxValue === 0) {
      return (
        <View style={styles.emptyChartContainer}>
          <Text style={styles.emptyChartText}>No data to display</Text>
        </View>
      );
    }

    const chartHeight = 120;
    const chartWidth = width - 60;
    const pointRadius = 4;
    
    let path = '';
    data.forEach((item, index) => {
      const x = (index / (data.length - 1)) * chartWidth;
      const y = chartHeight - (item[valueKey] / maxValue) * chartHeight;
      
      if (index === 0) {
        path += `M${x},${y}`;
      } else {
        path += ` L${x},${y}`;
      }
    });
    
    return (
      <View style={styles.lineChartContainer}>
        <Svg width={chartWidth} height={chartHeight + 30}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <Line
              key={i}
              x1="0"
              y1={chartHeight * ratio}
              x2={chartWidth}
              y2={chartHeight * ratio}
              stroke={colors.border}
              strokeWidth="0.5"
              strokeDasharray="3, 3"
            />
          ))}
          
          {/* Data line */}
          <Path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points and labels */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * chartWidth;
            const y = chartHeight - (item[valueKey] / maxValue) * chartHeight;
            
            return (
              <G key={index}>
                <Circle
                  cx={x}
                  cy={y}
                  r={pointRadius}
                  fill={color}
                  stroke="#fff"
                  strokeWidth="1.5"
                />
                <SvgText
                  x={x}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill={colors.text}
                >
                  {item.month}
                </SvgText>
                <SvgText
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill={colors.text}
                  fontWeight="bold"
                >
                  {item[valueKey]}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    );
  };

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
    periodSelector: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 8,
      padding: 4,
    },
    periodButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    periodButtonActive: {
      backgroundColor: '#ffffff',
    },
    periodText: {
      fontSize: 12,
      color: '#ffffff',
      fontWeight: '500',
    },
    periodTextActive: {
      color: colors.primary,
      fontWeight: '600',
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
    aiInsightsCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.primary + '30',
      elevation: 3,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    aiHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    aiTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
    },
    aiInsight: {
      backgroundColor: colors.primary + '10',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    aiInsightText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    enhancedChartContainer: {
      height: 240,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 10,
    },
    emptyChartContainer: {
      height: 160,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginVertical: 10,
    },
    emptyChartText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    chartLegend: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 10,
      gap: 20,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    legendColor: {
      width: 12,
      height: 12,
      borderRadius: 2,
      marginRight: 6,
    },
    legendText: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '500',
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
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    statIconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    statIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
      marginTop: 2,
    },
    aircraftItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    aircraftInfo: {
      flex: 1,
    },
    aircraftName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    aircraftDetails: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    progressContainer: {
      alignItems: 'flex-end',
      minWidth: 80,
    },
    progressBar: {
      height: 6,
      backgroundColor: colors.surface,
      borderRadius: 3,
      overflow: 'hidden',
      width: 60,
      marginBottom: 4,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
    },
    percentage: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    routeItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    routeInfo: {
      flex: 1,
    },
    routeName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    routeDetails: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    routeStats: {
      alignItems: 'flex-end',
    },
    routeFrequency: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    routeDuration: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    distributionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    distributionCard: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 10,
      flex: 1,
      minWidth: '45%',
      alignItems: 'center',
    },
    distributionValue: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primary,
      marginTop: 8,
    },
    distributionLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
    airlineItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    airlineInfo: {
      flex: 1,
    },
    airlineName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    airlineFlights: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    reliabilityScore: {
      alignItems: 'flex-end',
    },
    reliabilityValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
    reliabilityLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 2,
    },
    lineChartContainer: {
      height: 160,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 10,
    },
    chartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    chartTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    chartSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
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
              <Text style={styles.headerTitle}>Flight Analytics</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>Advanced flight data analysis and insights</Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Analyzing flight data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!analytics) return null;

  const maxFlights = analytics.monthlyTrend.length > 0 ? Math.max(...analytics.monthlyTrend.map(item => item.flights)) : 0;
  const maxHours = analytics.monthlyTrend.length > 0 ? Math.max(...analytics.monthlyTrend.map(item => item.hours)) : 0;

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
            <Text style={styles.headerTitle}>Flight Analytics</Text>
          </View>
          
          <View style={styles.periodSelector}>
            {['week', 'month', 'year'].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={[
                  styles.periodText,
                  selectedPeriod === period && styles.periodTextActive
                ]}>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <Text style={styles.headerSubtitle}>Advanced flight data analysis and insights</Text>
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

        {/* AI Insights */}
        <View style={styles.aiInsightsCard}>
          <View style={styles.aiHeader}>
            <Brain size={24} color={colors.primary} />
            <Text style={styles.aiTitle}>AI Flight Pattern Analysis</Text>
          </View>
          
          {insights.map((insight, index) => (
            <View key={index} style={styles.aiInsight}>
              <Text style={styles.aiInsightText}>{insight}</Text>
            </View>
          ))}
        </View>

        {/* Key Metrics */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <View style={[styles.statIcon, { backgroundColor: colors.primary + '20' }]}>
                <TrendingUp size={16} color={colors.primary} />
              </View>
            </View>
            <Text style={styles.statValue}>{analytics.onTimePercentage.toFixed(1)}%</Text>
            <Text style={styles.statLabel}>On-Time Performance</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <View style={[styles.statIcon, { backgroundColor: '#10b981' + '20' }]}>
                <Clock size={16} color="#10b981" />
              </View>
            </View>
            <Text style={styles.statValue}>{analytics.totalHours.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Total Flight Hours</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <View style={[styles.statIcon, { backgroundColor: '#f59e0b' + '20' }]}>
                <Target size={16} color="#f59e0b" />
              </View>
            </View>
            <Text style={styles.statValue}>{analytics.averageFlightTime.toFixed(1)}h</Text>
            <Text style={styles.statLabel}>Avg Flight Time</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <View style={[styles.statIcon, { backgroundColor: '#8b5cf6' + '20' }]}>
                <Plane size={16} color="#8b5cf6" />
              </View>
            </View>
            <Text style={styles.statValue}>{analytics.totalFlights}</Text>
            <Text style={styles.statLabel}>Total Flights</Text>
          </View>
        </View>

        {/* Enhanced Monthly Trend Chart */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <BarChart3 size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Monthly Flight & Hours Trend</Text>
          </View>
          {renderEnhancedBarChart(analytics.monthlyTrend, maxFlights, maxHours)}
        </View>

        {/* Detailed Line Charts */}
        {analytics.monthlyTrend.length > 0 && (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <TrendingUp size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Detailed Flight Trends</Text>
            </View>
            
            {/* Flight Count Trend */}
            <View style={{ marginBottom: 30 }}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Flight Count</Text>
                <Text style={styles.chartSubtitle}>
                  Total: {analytics.monthlyTrend.reduce((sum, item) => sum + item.flights, 0)}
                </Text>
              </View>
              {renderLineChart(analytics.monthlyTrend, 'flights', maxFlights, colors.primary)}
            </View>
            
            {/* Flight Hours Trend */}
            <View>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Flight Hours</Text>
                <Text style={styles.chartSubtitle}>
                  Total: {analytics.monthlyTrend.reduce((sum, item) => sum + item.hours, 0).toFixed(1)}h
                </Text>
              </View>
              {renderLineChart(analytics.monthlyTrend, 'hours', maxHours, '#10b981')}
            </View>
          </View>
        )}

        {/* Aircraft Breakdown */}
        {analytics.aircraftBreakdown.length > 0 && (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Plane size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Aircraft Type Analysis</Text>
            </View>
            {analytics.aircraftBreakdown.slice(0, 5).map((aircraft, index) => (
              <View key={index} style={styles.aircraftItem}>
                <View style={styles.aircraftInfo}>
                  <Text style={styles.aircraftName}>{aircraft.type}</Text>
                  <Text style={styles.aircraftDetails}>
                    {aircraft.count} flights • {aircraft.hours.toFixed(1)} hours
                  </Text>
                </View>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${Math.min(aircraft.percentage, 100)}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.percentage}>{aircraft.percentage.toFixed(1)}%</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Route Analysis */}
        {analytics.routeAnalysis.length > 0 && (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <MapPin size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Popular Routes</Text>
            </View>
            {analytics.routeAnalysis.map((route, index) => (
              <View key={index} style={styles.routeItem}>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeName}>{route.route}</Text>
                  <Text style={styles.routeDetails}>
                    Average duration: {route.avgDuration.toFixed(1)} hours
                  </Text>
                </View>
                <View style={styles.routeStats}>
                  <Text style={styles.routeFrequency}>{route.frequency}</Text>
                  <Text style={styles.routeDuration}>flights</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Flight Status Distribution */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <CheckCircle size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Flight Status Distribution</Text>
          </View>
          <View style={styles.distributionGrid}>
            <View style={styles.distributionCard}>
              <CheckCircle size={24} color="#10b981" />
              <Text style={[styles.distributionValue, { color: '#10b981' }]}>
                {analytics.statusDistribution.completed}
              </Text>
              <Text style={styles.distributionLabel}>Completed</Text>
            </View>
            
            <View style={styles.distributionCard}>
              <Clock size={24} color="#f59e0b" />
              <Text style={[styles.distributionValue, { color: '#f59e0b' }]}>
                {analytics.statusDistribution.scheduled}
              </Text>
              <Text style={styles.distributionLabel}>Scheduled</Text>
            </View>
            
            <View style={styles.distributionCard}>
              <Zap size={24} color={colors.primary} />
              <Text style={styles.distributionValue}>
                {analytics.statusDistribution.active}
              </Text>
              <Text style={styles.distributionLabel}>Active</Text>
            </View>
            
            <View style={styles.distributionCard}>
              <XCircle size={24} color="#ef4444" />
              <Text style={[styles.distributionValue, { color: '#ef4444' }]}>
                {analytics.statusDistribution.cancelled}
              </Text>
              <Text style={styles.distributionLabel}>Cancelled</Text>
            </View>
          </View>
        </View>

        {/* Flight Time Distribution */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Clock size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Flight Time Analysis</Text>
          </View>
          <View style={styles.distributionGrid}>
            <View style={styles.distributionCard}>
              <Text style={styles.distributionValue}>{analytics.timeDistribution.day}h</Text>
              <Text style={styles.distributionLabel}>Day Flying</Text>
            </View>
            
            <View style={styles.distributionCard}>
              <Text style={styles.distributionValue}>{analytics.timeDistribution.night}h</Text>
              <Text style={styles.distributionLabel}>Night Flying</Text>
            </View>
            
            <View style={styles.distributionCard}>
              <Text style={styles.distributionValue}>{analytics.timeDistribution.ifr}h</Text>
              <Text style={styles.distributionLabel}>IFR Conditions</Text>
            </View>
            
            <View style={styles.distributionCard}>
              <Text style={styles.distributionValue}>{analytics.timeDistribution.crossCountry}h</Text>
              <Text style={styles.distributionLabel}>Cross Country</Text>
            </View>
          </View>
        </View>

        {/* Airline Performance */}
        {analytics.airlineAnalysis.length > 0 && (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Award size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Airline Performance</Text>
            </View>
            {analytics.airlineAnalysis.map((airline, index) => (
              <View key={index} style={styles.airlineItem}>
                <View style={styles.airlineInfo}>
                  <Text style={styles.airlineName}>{airline.airline}</Text>
                  <Text style={styles.airlineFlights}>{airline.flights} flights</Text>
                </View>
                <View style={styles.reliabilityScore}>
                  <Text style={styles.reliabilityValue}>{airline.reliability.toFixed(1)}%</Text>
                  <Text style={styles.reliabilityLabel}>Reliability</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Sidebar 
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />
    </SafeAreaView>
  );
}