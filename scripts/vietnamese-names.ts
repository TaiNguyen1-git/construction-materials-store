// Vietnamese names data
export const VIETNAMESE_FIRST_NAMES = {
    male: ['Minh', 'Tuấn', 'Hùng', 'Dũng', 'Cường', 'Phong', 'Tài', 'Hoàng', 'Khoa', 'Long', 'Nam', 'Bình', 'Quân', 'Thắng', 'Hải'],
    female: ['Hoa', 'Lan', 'Mai', 'Linh', 'Thu', 'Hương', 'Ngọc', 'Trang', 'Thảo', 'Anh', 'Phương', 'Yến', 'Dung', 'Hằng', 'Ly']
}

export const VIETNAMESE_LAST_NAMES = [
    'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'
]

export const VIETNAMESE_MIDDLE_NAMES = {
    male: ['Văn', 'Đức', 'Quang', 'Công', 'Hữu', 'Xuân', 'Thanh', 'Minh'],
    female: ['Thị', 'Thanh', 'Kim', 'Thu', 'Ngọc', 'Thúy', 'Mai']
}

export function generateVietnameseName(gender: 'male' | 'female' = 'male'): string {
    const lastName = VIETNAMESE_LAST_NAMES[Math.floor(Math.random() * VIETNAMESE_LAST_NAMES.length)]
    const middleName = VIETNAMESE_MIDDLE_NAMES[gender][Math.floor(Math.random() * VIETNAMESE_MIDDLE_NAMES[gender].length)]
    const firstName = VIETNAMESE_FIRST_NAMES[gender][Math.floor(Math.random() * VIETNAMESE_FIRST_NAMES[gender].length)]

    return `${lastName} ${middleName} ${firstName}`
}

export function generatePhoneNumber(): string {
    const prefixes = ['090', '091', '093', '094', '097', '098', '099', '086', '088']
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const suffix = String(Math.floor(Math.random() * 10000000)).padStart(7, '0')
    return `${prefix}${suffix}`
}

export function generateAddress(): string {
    const streets = [
        'Nguyễn Ái Quốc', 'Phạm Văn Thuận', 'Võ Thị Sáu', 'Lê Duẩn', 'Cách Mạng Tháng 8',
        'Huỳnh Văn Nghệ', 'Phan Chu Trinh', 'Lý Thường Kiệt', 'Trường Chinh', 'Hoàng Diệu'
    ]
    const wards = [
        'P. Trảng Dài', 'P. Tân Phong', 'P. Tân Biên', 'P. Tân Mai', 'P. Quyết Thắng',
        'P. Tân Hiệp', 'P. Trung Dũng', 'P. Bửu Long', 'P. Long Bình', 'P. Tân Tiến'
    ]

    const houseNumber = Math.floor(Math.random() * 500) + 1
    const street = streets[Math.floor(Math.random() * streets.length)]
    const ward = wards[Math.floor(Math.random() * wards.length)]

    return `${houseNumber} ${street}, ${ward}, TP. Biên Hòa, Đồng Nai`
}
