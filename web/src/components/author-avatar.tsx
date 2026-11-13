import Image from 'next/image'

export function AuthorAvatar({
  name,
  avatarUrl,
}: {
  name: string
  avatarUrl?: string | null
}) {
  if (avatarUrl) {
    return (
      <Image
        className="author-avatar"
        src={avatarUrl}
        alt={name}
        width={30}
        height={30}
        unoptimized
      />
    )
  }
  return (
    <span className="author-avatar" aria-label={name}>
      {name.trim().slice(0, 2)}
    </span>
  )
}
