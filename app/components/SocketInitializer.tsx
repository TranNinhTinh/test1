'use client'

import { memo } from 'react'
import { useInitSocket } from '@/hooks/useInitSocket'

/**
 * Socket initialization wrapper component
 * Must be a client component to use hooks
 * Memoized to prevent unnecessary re-renders that would re-initialize sockets
 */
function SocketInitializerComponent() {
    useInitSocket()
    return null
}

export const SocketInitializer = memo(SocketInitializerComponent)
