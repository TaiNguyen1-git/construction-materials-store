import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import productService from '../services/productService';
import { Product } from '../types';

export default function InventoryScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const response = await productService.getProducts({
        page: 1,
        limit: 100,
        isActive: true,
      });

      if (response.success && response.data) {
        setProducts(response.data.data);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách kho hàng');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadInventory();
  };

  const getFilteredProducts = () => {
    return products.filter((product) => {
      if (!product.inventoryItem) return false;

      switch (filter) {
        case 'low':
          return (
            product.inventoryItem.quantity > 0 &&
            product.inventoryItem.quantity <= product.inventoryItem.minStockLevel
          );
        case 'out':
          return product.inventoryItem.quantity === 0;
        default:
          return true;
      }
    });
  };

  const getStockStatus = (product: Product) => {
    if (!product.inventoryItem) {
      return { text: 'Không có', color: '#6b7280', icon: 'help-circle' };
    }

    const { quantity, minStockLevel } = product.inventoryItem;
    if (quantity === 0) {
      return { text: 'Hết hàng', color: '#ef4444', icon: 'close-circle' };
    }
    if (quantity <= minStockLevel) {
      return { text: 'Sắp hết', color: '#f59e0b', icon: 'warning' };
    }
    return { text: 'Còn hàng', color: '#10b981', icon: 'checkmark-circle' };
  };

  const getStockPercentage = (product: Product) => {
    if (!product.inventoryItem) return 0;
    const { quantity, reorderPoint } = product.inventoryItem;
    return Math.min((quantity / reorderPoint) * 100, 100);
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const status = getStockStatus(item);
    const percentage = getStockPercentage(item);

    return (
      <View style={styles.productCard}>
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productSku}>SKU: {item.sku}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
            <Ionicons name={status.icon as any} size={16} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.text}
            </Text>
          </View>
        </View>

        {item.inventoryItem && (
          <>
            <View style={styles.stockInfo}>
              <View style={styles.stockRow}>
                <Text style={styles.stockLabel}>Tồn kho:</Text>
                <Text style={[styles.stockValue, { color: status.color }]}>
                  {item.inventoryItem.quantity} {item.unit}
                </Text>
              </View>
              <View style={styles.stockRow}>
                <Text style={styles.stockLabel}>Khả dụng:</Text>
                <Text style={styles.stockValue}>
                  {item.inventoryItem.availableQuantity} {item.unit}
                </Text>
              </View>
            </View>

            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: status.color }]} />
            </View>

            <View style={styles.thresholds}>
              <View style={styles.thresholdItem}>
                <Text style={styles.thresholdLabel}>Tối thiểu:</Text>
                <Text style={styles.thresholdValue}>
                  {item.inventoryItem.minStockLevel} {item.unit}
                </Text>
              </View>
              <View style={styles.thresholdItem}>
                <Text style={styles.thresholdLabel}>Điểm đặt lại:</Text>
                <Text style={styles.thresholdValue}>
                  {item.inventoryItem.reorderPoint} {item.unit}
                </Text>
              </View>
            </View>

            {item.inventoryItem.lastRestocked && (
              <Text style={styles.lastRestocked}>
                Nhập kho lần cuối: {new Date(item.inventoryItem.lastRestocked).toLocaleDateString('vi-VN')}
              </Text>
            )}
          </>
        )}
      </View>
    );
  };

  const filteredProducts = getFilteredProducts();
  const lowStockCount = products.filter(
    (p) => p.inventoryItem && p.inventoryItem.quantity > 0 && p.inventoryItem.quantity <= p.inventoryItem.minStockLevel
  ).length;
  const outOfStockCount = products.filter((p) => p.inventoryItem && p.inventoryItem.quantity === 0).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Đang tải dữ liệu kho...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản Lý Kho</Text>

        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statLabel}>Tổng SP</Text>
          </View>
          <View style={[styles.statBox, styles.statWarning]}>
            <Text style={styles.statValue}>{lowStockCount}</Text>
            <Text style={styles.statLabel}>Sắp hết</Text>
          </View>
          <View style={[styles.statBox, styles.statDanger]}>
            <Text style={styles.statValue}>{outOfStockCount}</Text>
            <Text style={styles.statLabel}>Hết hàng</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
              Tất cả
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'low' && styles.filterTabActive]}
            onPress={() => setFilter('low')}
          >
            <Text style={[styles.filterTabText, filter === 'low' && styles.filterTabTextActive]}>
              Sắp hết ({lowStockCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'out' && styles.filterTabActive]}
            onPress={() => setFilter('out')}
          >
            <Text style={[styles.filterTabText, filter === 'out' && styles.filterTabTextActive]}>
              Hết hàng ({outOfStockCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {filter === 'all' ? 'Không có sản phẩm trong kho' : 'Không có sản phẩm'}
            </Text>
          </View>
        }
      />
    </View>
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
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statWarning: {
    backgroundColor: '#fef3c7',
  },
  statDanger: {
    backgroundColor: '#fee2e2',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#2563eb',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  productCard: {
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
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productSku: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  stockInfo: {
    marginBottom: 12,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stockLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  thresholds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  thresholdItem: {
    flex: 1,
  },
  thresholdLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  thresholdValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  lastRestocked: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
});
