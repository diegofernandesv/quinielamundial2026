"use client"
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SidebarContent } from './Sidebar'
import { BottomNav } from './BottomNav'
import type { Profile } from '@/types/database'

interface AppShellProps {
  profile: Profile
  children: React.ReactNode
  currentPoolId?: string
  pendingRequests?: number
}

export function AppShell({ profile, children, currentPoolId, pendingRequests = 0 }: AppShellProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col shrink-0 border-r bg-sidebar">
        <SidebarContent
          profile={profile}
          currentPoolId={currentPoolId}
          onLogout={handleLogout}
          pendingRequests={pendingRequests}
        />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto overscroll-none">
          {/* bottom padding: floating mobile nav + safe area; normal on desktop */}
          <div className="mx-auto max-w-6xl px-4 pt-5 pb-[calc(72px+env(safe-area-inset-bottom,0px)+1.5rem)] sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav profile={profile} currentPoolId={currentPoolId} pendingRequests={pendingRequests} />
    </div>
  )
}
