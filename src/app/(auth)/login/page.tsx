import { LoginPageClient } from './LoginPageClient'

interface LoginPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const nextParam = resolvedSearchParams?.next
  const nextPath = Array.isArray(nextParam) ? nextParam[0] : nextParam

  return <LoginPageClient nextPath={nextPath ?? '/dashboard'} />
}
