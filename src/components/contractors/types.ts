import { Users, HardHat, Zap, Paintbrush, Briefcase, Wrench } from 'lucide-react'

export const SKILL_MAP: Record<string, string> = {
    'all': 'Tất cả',
    'rough_construction': 'Xây thô',
    'mep': 'Điện nước',
    'painting': 'Sơn bả',
    'interior': 'Nội thất',
    'repair': 'Sửa chữa',
    'flooring': 'Lát nền',
    'tiling': 'Ốp lát',
    'roofing': 'Làm mái',
    'renovation': 'Cải tạo',
    'plumbing': 'Điện nước',
    'electrical': 'Hệ thống điện',
    'landscaping': 'Cảnh quan'
}

export const getSkillName = (skill: string | null | undefined) => {
    if (!skill) return 'Chuyên gia'
    const normalizedSkill = skill.toLowerCase()
    if (SKILL_MAP[normalizedSkill]) return SKILL_MAP[normalizedSkill]
    return skill
}

export const CATEGORIES = [
    { id: 'all', name: 'Tất cả', icon: Users },
    { id: 'rough_construction', name: 'Xây thô', icon: HardHat, dbValue: 'Xây thô' },
    { id: 'mep', name: 'Điện nước', icon: Zap, dbValue: 'Điện nước' },
    { id: 'painting', name: 'Sơn bả', icon: Paintbrush, dbValue: 'Sơn bả' },
    { id: 'interior', name: 'Nội thất', icon: Briefcase, dbValue: 'Nội thất' },
    { id: 'repair', name: 'Sửa chữa', icon: Wrench, dbValue: 'Sửa chữa' },
]

export const CITIES = ['Toàn quốc', 'Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Biên Hòa']

export interface Contractor {
    id: string
    displayName: string
    companyName?: string
    city?: string
    avgRating?: number | string
    experienceYears?: number | string
    totalProjectsCompleted?: number | string
    teamSize?: number | string
    bio?: string
    skills?: string[]
}
