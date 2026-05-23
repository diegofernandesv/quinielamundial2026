import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/database'

interface UserAvatarProps {
  profile: Pick<Profile, 'full_name' | 'nickname' | 'avatar_url'>
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'size-7', md: 'size-9', lg: 'size-12' }

export function UserAvatar({ profile, className, size = 'md' }: UserAvatarProps) {
  const name = profile.nickname ?? profile.full_name
  return (
    <Avatar className={cn(sizes[size], className)}>
      {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={name ?? ''} />}
      <AvatarFallback className="text-xs font-semibold">{getInitials(name)}</AvatarFallback>
    </Avatar>
  )
}
