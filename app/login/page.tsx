import LoginForm from './LoginForm'

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ error?: string | string[] }>
}) {
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  return <LoginForm initialError={error} />
}
