import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import dashboardService from '../services/dashboardService';
import { DashboardStats } from '../types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const response = await dashboardService.getDashboardStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardStats();
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('vi-VN')}đ`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bảng Điều Khiển</Text>
        <Text style={styles.headerSubtitle}>Tổng quan hoạt động kinh doanh</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="cube"
          iconColor="#3b82f6"
          title="Tổng Sản Phẩm"
          value={stats?.totalProducts.toString() || '0'}
          backgroundColor="#eff6ff"
        />
        <StatCard
          icon="cart"
          iconColor="#10b981"
          title="Tổng Đơn Hàng"
          value={stats?.totalOrders.toString() || '0'}
          backgroundColor="#f0fdf4"
        />
        <StatCard
          icon="people"
          iconColor="#8b5cf6"
          title="Khách Hàng"
          value={stats?.totalCustomers.toString() || '0'}
          backgroundColor="#faf5ff"
        />
        <StatCard
          icon="cash"
          iconColor="#10b981"
          title="Doanh Thu"
          value={formatCurrency(stats?.totalRevenue || 0)}
          backgroundColor="#f0fdf4"
        />
      </View>

      {/* Alerts */}
      <View style={styles.alertsContainer}>
        <Text style={styles.sectionTitle}>Cảnh Báo</Text>
        
        {stats && stats.lowStockItems > 0 && (
          <TouchableOpacity style={[styles.alertCard, styles.alertWarning]}>
            <View style={styles.alertIcon}>
              <Ionicons name="warning" size={24} color="#f59e0b" />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Sản phẩm sắp hết hàng</Text>
              <Text style={styles.alertText}>
                {stats.lowStockItems} sản phẩm cần nhập thêm
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}

        {stats && stats.pendingOrders > 0 && (
          <TouchableOpacity style={[styles.alertCard, styles.alertInfo]}>
            <View style={styles.alertIcon}>
              <Ionicons name="time" size={24} color="#3b82f6" />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Đơn hàng chờ xử lý</Text>
              <Text style={styles.alertText}>
                {stats.pendingOrders} đơn hàng cần xử lý
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Thao Tác Nhanh</Text>
        <View style={styles.quickActionsGrid}>
          <QuickActionButton
            icon="scan"
            label="Quét Hóa Đơn"
            color="#f59e0b"
            onPress={() => navigation.navigate('OCRScanner')}
          />
          <QuickActionButton
            icon="add-circle"
            label="Thêm Sản Phẩm"
            color="#3b82f6"
            onPress={() => {}}
          />
          <QuickActionButton
            icon="document-text"
            label="Tạo Hóa Đơn"
            color="#8b5cf6"
            onPress={() => {}}
          />
          <QuickActionButton
            icon="bar-chart"
            label="Báo Cáo"
            color="#10b981"
            onPress={() => {}}
          />
        </View>
      </View>
    </ScrollView>
  );
}

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  value: string;
  backgroundColor: string;
}

function StatCard({ icon, iconColor, title, value, backgroundColor }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

interface QuickActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}

function QuickActionButton({ icon, label, color, onPress }: QuickActionButtonProps) {
  return (
    <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: '1%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  alertsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alertWarning: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  alertInfo: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  alertIcon: {
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  alertText: {
    fontSize: 14,
    color: '#6b7280',
  },
  quickActionsContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: '1%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});
