"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MenuIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { SidebarContent } from './Sidebar'
import type { Profile } from '@/types/database'

interface AppShellProps {
  profile: Profile
  children: React.ReactNode
  currentPoolId?: string
}

export function AppShell({ profile, children, currentPoolId }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-background shrink-0">
        <SidebarContent
          profile={profile}
          currentPoolId={currentPoolId}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent
            profile={profile}
            currentPoolId={currentPoolId}
            onLogout={handleLogout}
            onClose={() => setSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="flex lg:hidden h-14 items-center gap-3 border-b px-4 shrink-0">
          <Button variant="ghost" size="icon-sm" onClick={() => setSidebarOpen(true)}>
            <MenuIcon className="size-5" />
          </Button>
          <span className="font-semibold text-sm">Quiniela Mundial 2026</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
