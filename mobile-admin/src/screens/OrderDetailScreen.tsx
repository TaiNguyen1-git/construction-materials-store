import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import orderService from '../services/orderService';
import { Order, OrderStatus } from '../types';
import { Ionicons } from '@expo/vector-icons';

type OrderDetailRouteProp = RouteProp<RootStackParamList, 'OrderDetail'>;
type OrderDetailNavigationProp = StackNavigationProp<RootStackParamList, 'OrderDetail'>;

interface Props {
  route: OrderDetailRouteProp;
  navigation: OrderDetailNavigationProp;
}

const NEXT_STATUS_MAP: Record<OrderStatus, { next: OrderStatus | null; label: string }> = {
  PENDING: { next: 'CONFIRMED', label: 'Xác nhận đơn' },
  CONFIRMED: { next: 'PROCESSING', label: 'Đang xử lý' },
  PROCESSING: { next: 'SHIPPED', label: 'Đã gửi hàng' },
  SHIPPED: { next: 'COMPLETED', label: 'Hoàn thành' },
  COMPLETED: { next: null, label: '' },
  CANCELLED: { next: null, label: '' },
};

export default function OrderDetailScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    loadOrderDetail();
  }, [orderId]);

  const loadOrderDetail = async () => {
    try {
      const response = await orderService.getOrderById(orderId);
      if (response.success && response.data) {
        setOrder(response.data);
      } else {
        Alert.alert('Lỗi', response.error?.message || 'Không thể tải thông tin đơn hàng');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tải dữ liệu');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: OrderStatus, tracking?: string) => {
    if (!order) return;

    setUpdating(true);
    try {
      const response = await orderService.updateOrderStatus(order.id, newStatus, tracking);
      if (response.success && response.data) {
        setOrder(response.data);
        Alert.alert('Thành công', `Đã cập nhật trạng thái đơn hàng thành ${getStatusText(newStatus)}`);
        setShowTrackingModal(false);
      } else {
        Alert.alert('Lỗi', response.error?.message || 'Không thể cập nhật trạng thái');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi cập nhật');
    } finally {
      setUpdating(false);
    }
  };

  const handleNextStatus = () => {
    if (!order) return;

    const nextStatusInfo = NEXT_STATUS_MAP[order.status];
    if (!nextStatusInfo.next) return;

    if (nextStatusInfo.next === 'SHIPPED') {
      setShowTrackingModal(true);
    } else {
      Alert.alert(
        'Xác nhận',
        `Bạn có chắc chắn muốn ${nextStatusInfo.label.toLowerCase()}?`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xác nhận',
            onPress: () => updateOrderStatus(nextStatusInfo.next!),
          },
        ]
      );
    }
  };

  const handleCancelOrder = () => {
    if (!order) return;

    Alert.alert(
      'Hủy đơn hàng',
      'Bạn có chắc chắn muốn hủy đơn hàng này?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy đơn',
          style: 'destructive',
          onPress: () => updateOrderStatus('CANCELLED'),
        },
      ]
    );
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return '#f59e0b';
      case 'CONFIRMED': return '#3b82f6';
      case 'PROCESSING': return '#8b5cf6';
      case 'SHIPPED': return '#6366f1';
      case 'COMPLETED': return '#10b981';
      case 'CANCELLED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'Chờ xử lý';
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'PROCESSING': return 'Đang xử lý';
      case 'SHIPPED': return 'Đã gửi hàng';
      case 'COMPLETED': return 'Hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!order) {
    return null;
  }

  const nextStatusInfo = NEXT_STATUS_MAP[order.status];
  const canUpdateStatus = nextStatusInfo.next !== null;
  const canCancel = order.status !== 'CANCELLED' && order.status !== 'COMPLETED';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Order Header */}
        <View style={styles.section}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {getStatusText(order.status)}
            </Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông Tin Khách Hàng</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={20} color="#6b7280" />
            <Text style={styles.infoText}>{order.customer.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color="#6b7280" />
            <Text style={styles.infoText}>{order.customer.email}</Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sản Phẩm Đặt Hàng</Text>
          {order.orderItems.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product.name}</Text>
                <Text style={styles.itemDetails}>
                  {item.quantity} x {item.unitPrice.toLocaleString('vi-VN')}đ
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                {item.totalPrice.toLocaleString('vi-VN')}đ
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng cộng:</Text>
            <Text style={styles.totalValue}>
              {order.totalAmount.toLocaleString('vi-VN')}đ
            </Text>
          </View>
        </View>

        {/* Shipping & Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông Tin Giao Hàng & Thanh Toán</Text>
          {order.shippingAddress && (
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#6b7280" />
              <Text style={[styles.infoText, styles.flex1]}>{order.shippingAddress}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="card" size={20} color="#6b7280" />
            <Text style={styles.infoText}>{order.paymentMethod}</Text>
          </View>
          {order.trackingNumber && (
            <View style={styles.infoRow}>
              <Ionicons name="navigate-circle" size={20} color="#6b7280" />
              <Text style={styles.infoText}>Mã vận đơn: {order.trackingNumber}</Text>
            </View>
          )}
        </View>

        {/* Note */}
        {order.note && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ghi Chú</Text>
            <Text style={styles.noteText}>{order.note}</Text>
          </View>
        )}

        {/* Timestamps */}
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text style={styles.timestampLabel}>Ngày đặt:</Text>
            <Text style={styles.timestampValue}>
              {new Date(order.createdAt).toLocaleString('vi-VN')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.timestampLabel}>Cập nhật:</Text>
            <Text style={styles.timestampValue}>
              {new Date(order.updatedAt).toLocaleString('vi-VN')}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        {(canUpdateStatus || canCancel) && (
          <View style={styles.actionButtons}>
            {canUpdateStatus && (
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleNextStatus}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>{nextStatusInfo.label}</Text>
                )}
              </TouchableOpacity>
            )}
            {canCancel && (
              <TouchableOpacity
                style={[styles.button, styles.buttonDanger]}
                onPress={handleCancelOrder}
                disabled={updating}
              >
                <Text style={styles.buttonText}>Hủy Đơn</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Tracking Number Modal */}
      <Modal
        visible={showTrackingModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTrackingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nhập Mã Vận Đơn</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nhập mã vận đơn"
              value={trackingNumber}
              onChangeText={setTrackingNumber}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowTrackingModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={() => updateOrderStatus('SHIPPED', trackingNumber)}
                disabled={!trackingNumber || updating}
              >
                {updating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalButtonTextConfirm}>Xác Nhận</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 32,
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
  orderNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 10,
  },
  flex1: {
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
    color: '#6b7280',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  noteText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  timestampLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  timestampValue: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 'auto',
  },
  actionButtons: {
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#2563eb',
  },
  buttonDanger: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f3f4f6',
  },
  modalButtonConfirm: {
    backgroundColor: '#2563eb',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
