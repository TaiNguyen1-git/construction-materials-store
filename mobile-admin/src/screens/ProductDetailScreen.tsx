import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import productService from '../services/productService';
import { Product } from '../types';
import { Ionicons } from '@expo/vector-icons';

type ProductDetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;
type ProductDetailNavigationProp = StackNavigationProp<RootStackParamList, 'ProductDetail'>;

interface Props {
  route: ProductDetailRouteProp;
  navigation: ProductDetailNavigationProp;
}

export default function ProductDetailScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProductDetail();
  }, [productId]);

  const loadProductDetail = async () => {
    try {
      const response = await productService.getProductById(productId);
      if (response.success && response.data) {
        setProduct(response.data);
      } else {
        Alert.alert('Lỗi', response.error?.message || 'Không thể tải thông tin sản phẩm');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tải dữ liệu');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!product) {
    return null;
  }

  const getStockStatus = () => {
    if (!product.inventoryItem) return { text: 'Không có thông tin', color: '#6b7280' };
    const { quantity, minStockLevel } = product.inventoryItem;
    if (quantity === 0) return { text: 'Hết hàng', color: '#ef4444' };
    if (quantity <= minStockLevel) return { text: 'Sắp hết', color: '#f59e0b' };
    return { text: 'Còn hàng', color: '#10b981' };
  };

  const stockStatus = getStockStatus();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header Info */}
        <View style={styles.section}>
          <View style={styles.headerRow}>
            <View style={styles.flex1}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.sku}>SKU: {product.sku}</Text>
            </View>
            {product.isActive ? (
              <View style={[styles.badge, styles.badgeActive]}>
                <Text style={styles.badgeTextActive}>Hoạt động</Text>
              </View>
            ) : (
              <View style={[styles.badge, styles.badgeInactive]}>
                <Text style={styles.badgeTextInactive}>Tạm ngưng</Text>
              </View>
            )}
          </View>

          {product.description && (
            <Text style={styles.description}>{product.description}</Text>
          )}
        </View>

        {/* Price Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông Tin Giá</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Giá bán:</Text>
            <Text style={styles.infoValuePrice}>
              {product.price.toLocaleString('vi-VN')}đ / {product.unit}
            </Text>
          </View>
          {product.costPrice && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Giá vốn:</Text>
              <Text style={styles.infoValue}>
                {product.costPrice.toLocaleString('vi-VN')}đ / {product.unit}
              </Text>
            </View>
          )}
          {product.costPrice && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Lợi nhuận:</Text>
              <Text style={[styles.infoValue, { color: '#10b981' }]}>
                {(product.price - product.costPrice).toLocaleString('vi-VN')}đ
                ({(((product.price - product.costPrice) / product.costPrice) * 100).toFixed(1)}%)
              </Text>
            </View>
          )}
        </View>

        {/* Inventory Info */}
        {product.inventoryItem && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông Tin Kho</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Trạng thái:</Text>
              <Text style={[styles.infoValue, { color: stockStatus.color }]}>
                {stockStatus.text}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Số lượng tồn:</Text>
              <Text style={styles.infoValue}>
                {product.inventoryItem.quantity} {product.unit}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Số lượng khả dụng:</Text>
              <Text style={styles.infoValue}>
                {product.inventoryItem.availableQuantity} {product.unit}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mức tồn tối thiểu:</Text>
              <Text style={styles.infoValue}>
                {product.inventoryItem.minStockLevel} {product.unit}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Điểm đặt hàng lại:</Text>
              <Text style={styles.infoValue}>
                {product.inventoryItem.reorderPoint} {product.unit}
              </Text>
            </View>
          </View>
        )}

        {/* Category Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh Mục</Text>
          <View style={styles.categoryCard}>
            <Ionicons name="grid" size={20} color="#6b7280" />
            <Text style={styles.categoryName}>{product.category.name}</Text>
          </View>
        </View>

        {/* Timestamps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông Tin Khác</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày tạo:</Text>
            <Text style={styles.infoValue}>
              {new Date(product.createdAt).toLocaleDateString('vi-VN')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cập nhật lần cuối:</Text>
            <Text style={styles.infoValue}>
              {new Date(product.updatedAt).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        </View>

        {/* Warning */}
        {product.inventoryItem && 
         product.inventoryItem.quantity <= product.inventoryItem.minStockLevel && (
          <View style={styles.warningBox}>
            <Ionicons name="warning" size={24} color="#f59e0b" />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Cảnh báo tồn kho thấp</Text>
              <Text style={styles.warningText}>
                Sản phẩm này đang có số lượng tồn kho thấp hơn mức tối thiểu. 
                Vui lòng nhập thêm hàng.
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
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
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  flex1: {
    flex: 1,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  sku: {
    fontSize: 14,
    color: '#6b7280',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12,
  },
  badgeActive: {
    backgroundColor: '#d1fae5',
  },
  badgeInactive: {
    backgroundColor: '#fee2e2',
  },
  badgeTextActive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065f46',
  },
  badgeTextInactive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#991b1b',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  infoValuePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 18,
  },
});
