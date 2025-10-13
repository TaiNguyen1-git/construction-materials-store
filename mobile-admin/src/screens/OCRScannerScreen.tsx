import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ocrService, { OCRResult } from '../services/ocrService';

export default function OCRScannerScreen() {
  const navigation = useNavigation();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [scanType, setScanType] = useState<'invoice' | 'general'>('invoice');
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      await requestPermission();
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        setImageUri(photo.uri);
      } catch (error) {
        Alert.alert('Lỗi', 'Không thể chụp ảnh');
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const processImage = async () => {
    if (!imageUri) return;

    setProcessing(true);
    try {
      const response = scanType === 'invoice'
        ? await ocrService.processInvoice(imageUri)
        : await ocrService.scanText(imageUri);

      if (response.success && response.data) {
        setOcrResult(response.data);
        Alert.alert(
          'Thành công',
          `Đã quét thành công${response.data.extractedData?.items ? ` ${response.data.extractedData.items.length} sản phẩm` : ''}!`
        );
      } else {
        Alert.alert('Lỗi', response.error?.message || 'Không thể xử lý hình ảnh');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi xử lý hình ảnh');
    } finally {
      setProcessing(false);
    }
  };

  const resetScan = () => {
    setImageUri(null);
    setOcrResult(null);
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#9ca3af" />
        <Text style={styles.permissionText}>Cần quyền truy cập camera</Text>
        <Text style={styles.permissionSubtext}>
          Vui lòng cấp quyền camera để quét hóa đơn và tài liệu
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Cấp Quyền</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show result screen
  if (ocrResult) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.resultContainer}>
          {/* Image Preview */}
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.resultImage} />
          )}

          {/* Confidence Score */}
          <View style={styles.confidenceCard}>
            <Text style={styles.confidenceLabel}>Độ chính xác:</Text>
            <View style={styles.confidenceBar}>
              <View
                style={[
                  styles.confidenceFill,
                  {
                    width: `${ocrResult.confidence * 100}%`,
                    backgroundColor:
                      ocrResult.confidence > 0.8 ? '#10b981' : ocrResult.confidence > 0.6 ? '#f59e0b' : '#ef4444',
                  },
                ]}
              />
            </View>
            <Text style={styles.confidenceValue}>{(ocrResult.confidence * 100).toFixed(1)}%</Text>
          </View>

          {/* Extracted Data */}
          {ocrResult.extractedData && (
            <View style={styles.dataSection}>
              <Text style={styles.sectionTitle}>Thông Tin Trích Xuất</Text>

              {ocrResult.extractedData.invoiceNumber && (
                <DataRow label="Số hóa đơn" value={ocrResult.extractedData.invoiceNumber} />
              )}
              {ocrResult.extractedData.date && (
                <DataRow label="Ngày" value={ocrResult.extractedData.date} />
              )}
              {ocrResult.extractedData.supplier && (
                <DataRow label="Nhà cung cấp" value={ocrResult.extractedData.supplier} />
              )}
              {ocrResult.extractedData.total && (
                <DataRow
                  label="Tổng tiền"
                  value={`${ocrResult.extractedData.total.toLocaleString('vi-VN')}đ`}
                  highlight
                />
              )}

              {/* Items */}
              {ocrResult.extractedData.items && ocrResult.extractedData.items.length > 0 && (
                <View style={styles.itemsSection}>
                  <Text style={styles.sectionTitle}>Sản Phẩm ({ocrResult.extractedData.items.length})</Text>
                  {ocrResult.extractedData.items.map((item, index) => (
                    <View key={index} style={styles.itemCard}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <View style={styles.itemDetails}>
                        {item.quantity && (
                          <Text style={styles.itemDetailText}>SL: {item.quantity}</Text>
                        )}
                        {item.price && (
                          <Text style={styles.itemDetailText}>
                            Giá: {item.price.toLocaleString('vi-VN')}đ
                          </Text>
                        )}
                        {item.total && (
                          <Text style={[styles.itemDetailText, styles.itemTotal]}>
                            TT: {item.total.toLocaleString('vi-VN')}đ
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Raw Text */}
          <View style={styles.rawTextSection}>
            <Text style={styles.sectionTitle}>Văn Bản Gốc</Text>
            <Text style={styles.rawText}>{ocrResult.text}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.actionButton, styles.scanAgainButton]} onPress={resetScan}>
              <Ionicons name="camera-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Quét Lại</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={() => {
                Alert.alert('Thông báo', 'Tính năng đang phát triển');
              }}
            >
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Lưu Kết Quả</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Show preview screen with image
  if (imageUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: imageUri }} style={styles.previewImage} />

        {/* Scan Type Selector */}
        <View style={styles.scanTypeContainer}>
          <TouchableOpacity
            style={[styles.scanTypeButton, scanType === 'invoice' && styles.scanTypeButtonActive]}
            onPress={() => setScanType('invoice')}
          >
            <Text style={[styles.scanTypeText, scanType === 'invoice' && styles.scanTypeTextActive]}>
              Hóa Đơn
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.scanTypeButton, scanType === 'general' && styles.scanTypeButtonActive]}
            onPress={() => setScanType('general')}
          >
            <Text style={[styles.scanTypeText, scanType === 'general' && styles.scanTypeTextActive]}>
              Văn Bản
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.previewActions}>
          <TouchableOpacity style={[styles.previewButton, styles.cancelButton]} onPress={resetScan}>
            <Ionicons name="close" size={24} color="#fff" />
            <Text style={styles.previewButtonText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.previewButton, styles.processButton]}
            onPress={processImage}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="scan" size={24} color="#fff" />
                <Text style={styles.previewButtonText}>Quét</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show camera screen
  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quét Hóa Đơn</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Guide Frame */}
        <View style={styles.guideFrame}>
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>Đặt hóa đơn trong khung</Text>
        </View>

        {/* Bottom Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={pickImage}>
            <Ionicons name="images" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

interface DataRowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function DataRow({ label, value, highlight }: DataRowProps) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}:</Text>
      <Text style={[styles.dataValue, highlight && styles.dataValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 24,
  },
  permissionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  guideFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 40,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#fff',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instructions: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 28,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  scanTypeContainer: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  scanTypeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  scanTypeButtonActive: {
    backgroundColor: '#2563eb',
  },
  scanTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  scanTypeTextActive: {
    color: '#fff',
  },
  previewActions: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 40,
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  cancelButton: {
    backgroundColor: '#6b7280',
  },
  processButton: {
    backgroundColor: '#2563eb',
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  resultImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  confidenceCard: {
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
  confidenceLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
  },
  dataSection: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dataLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  dataValueHighlight: {
    fontSize: 16,
    color: '#2563eb',
  },
  itemsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  itemCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  itemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  itemDetailText: {
    fontSize: 12,
    color: '#6b7280',
  },
  itemTotal: {
    fontWeight: '600',
    color: '#2563eb',
  },
  rawTextSection: {
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
  rawText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  scanAgainButton: {
    backgroundColor: '#6b7280',
  },
  saveButton: {
    backgroundColor: '#2563eb',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
