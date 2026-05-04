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
    title?: string       // From Marketplace API
    name?: string        // From Projects API
    description: string
    status: string
    createdAt: string
    estimatedBudget?: number // From Marketplace API
    budget?: number          // From Projects API
    location?: string
    city?: string
    projectType?: string     // From Marketplace API
    category?: string        // From Projects API
    contactName?: string     // From Marketplace API
    guestName?: string       // From Projects API
    viewCount?: number
    applicationCount?: number // From Marketplace API
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
