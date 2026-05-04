export interface Project {
    id: string
    title: string
    description: string | null
    status: string
    createdAt: string
    estimatedBudget: number | null
    location: string | null
    city: string | null
    projectType: string | null
    contactName?: string
    applicationCount: number
    viewCount: number
    isUrgent: boolean
    matchScore?: number
    matchReasons?: string[]
}

export interface ApiProjectResponse {
    id: string
    name: string
    description: string
    status: string
    createdAt: string
    budget: number
    location?: string
    city?: string
    category?: string
    guestName?: string
    viewCount?: number
    isUrgent?: boolean
    customer?: { 
        user?: { 
            name: string 
        } 
    }
    projectTasks?: { 
        id: string; 
        status: string 
    }[]
}
