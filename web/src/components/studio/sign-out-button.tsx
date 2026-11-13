import { signOutAction } from '@/app/actions/auth'

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button type="submit">退出写作台</button>
    </form>
  )
}
