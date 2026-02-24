'use client'

import { LucideIcon, Grid3X3, PaintBucket, Hammer } from 'lucide-react'
import { RoomDimension, MaterialEstimate, EstimatorResult } from '@/lib/estimator/estimator-types'

export type { RoomDimension, MaterialEstimate, EstimatorResult }

export interface ProjectType {
    id: 'general' | 'flooring' | 'painting' | 'tiling'
    name: string
    icon: LucideIcon
    color: string
}

export const PROJECT_TYPES: ProjectType[] = [
    { id: 'flooring', name: 'Lát nền', icon: Grid3X3, color: 'bg-blue-500' },
    { id: 'painting', name: 'Sơn tường', icon: PaintBucket, color: 'bg-green-500' },
    { id: 'tiling', name: 'Ốp tường', icon: Grid3X3, color: 'bg-purple-500' },
    { id: 'general', name: 'Tổng quát', icon: Hammer, color: 'bg-orange-500' },
]

export const LOADING_PHASES = [
    'Đang khởi tạo hệ thống AI...',
    'Đang quét hình ảnh bản vẽ...',
    'Đang nhận diện không gian và diện tích...',
    'Đang bóc tách khối lượng vật tư...',
    'Đang tính toán đơn giá thị trường...',
    'Đang áp dụng tiêu chuẩn TCVN...',
    'Đang hoàn thiện dự toán...'
]

export const LOADING_TIPS = [
    "SmartBuild AI có thể nhận diện cả bản vẽ tay sơ bộ của bạn.",
    "Bóc tách vật tư bằng AI giúp giảm 90% thời gian làm việc thủ công.",
    "Chúng tôi sử dụng tiêu chuẩn TCVN để tính toán khối lượng xây thô.",
    "Bạn có thể sửa lại diện tích sau khi AI phân tích xong.",
    "Đừng quên trừ hao lãng phí khoảng 5% khi đặt mua hàng thực tế."
]

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount)
}
