'use client'

import React, { ReactNode } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Permission } from '@/lib/permissions'

interface PermissionGuardProps {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
}

/**
 * @description A wrapper component that shows its children only if the user has the required permission.
 */
export default function PermissionGuard({ 
  permission, 
  children, 
  fallback = null 
}: PermissionGuardProps) {
  const { hasPermission, isLoading } = useAuth()

  // During loading, we stay silent or show nothing to prevent flashes
  if (isLoading) return null

  if (hasPermission(permission)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
