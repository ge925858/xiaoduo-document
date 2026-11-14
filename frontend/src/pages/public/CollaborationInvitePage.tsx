import { useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  Info,
  KeyRound,
  LoaderCircle,
  Mail,
  UserRound,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { formatDateTime } from '../../lib/text'
import { usePageTitle } from '../../lib/usePageTitle'
import { useSiteStore } from '../../store/siteStore'

export function CollaborationInvitePage() {
  const { token } = useParams()
  usePageTitle('接受协作邀请 · 知笺')
  const invite = useSiteStore((state) =>
    state.collaborationInvites.find((item) => item.token === token),
  )
  const notes = useSiteStore((state) => state.notes)
  const studioAuthed = useSiteStore((state) => state.studioAuthed)
  const studioRole = useSiteStore((state) => state.studioRole)
  const acceptInvite = useSiteStore(
    (state) => state.acceptCollaborationInvite,
  )
  const [displayName, setDisplayName] = useState(invite?.displayName ?? '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [now] = useState(() => Date.now())
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  if (!invite) {
    return (
      <InviteState
        title="邀请链接不存在"
        description="请向站主确认链接是否完整，或者重新生成邀请。"
      />
    )
  }

  const expired =
    invite.status === 'expired' ||
    (invite.status === 'pending' &&
      new Date(invite.expiresAt).getTime() <= now)

  if (invite.status !== 'pending' || expired) {
    return (
      <InviteState
        title={
          expired
            ? '邀请链接已过期'
            : invite.status === 'activated'
              ? '这个邀请已经激活'
              : '邀请已经被撤销'
        }
        description={
          invite.status === 'activated'
            ? '账号已经创建，请直接使用邮箱和密码登录。'
            : '请联系站主重新生成邀请链接。'
        }
      />
    )
  }

  const invitedNotes = invite.noteIds
    .map((noteId) => notes.find((note) => note.id === noteId))
    .filter((note): note is NonNullable<typeof note> => Boolean(note))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (password.length < 6) {
      toast.error('密码至少需要 6 个字符')
      return
    }
    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }
    setLoading(true)
    const result = await acceptInvite(invite.token, displayName, password)
    setLoading(false)
    if (result === 'expired') {
      toast.error('邀请已经过期')
      return
    }
    if (result === 'invalid') {
      toast.error('邀请无效或已经使用')
      return
    }
    toast.success('协作账号已激活')
    navigate('/studio', { replace: true })
  }

  return (
    <main className="invite-accept-page">
      <div className="invite-accept-card">
        <Link to="/" className="invite-back-link">
          <ArrowLeft size={18} />
          返回知笺
        </Link>
        <p className="section-kicker mt-8">Collaboration invitation</p>
        <h1>接受协作邀请</h1>
        <p className="invite-accept-intro">
          设置账号后，你只会看到下面这些被授权的文章。
        </p>

        <div className="invite-account-email">
          <Mail size={19} />
          <span>{invite.email}</span>
        </div>

        {studioAuthed && (
          <div className="invite-session-warning">
            <Info size={19} />
            <span>
              当前已以{studioRole === 'owner' ? '站主' : '协作者'}身份登录。
              激活此邀请后会切换为新的协作者会话，便于调试邀请流程。
            </span>
          </div>
        )}

        <div className="invite-scope-list">
          <p>可编辑文章</p>
          {invitedNotes.map((note) => (
            <span key={note.id}>{note.title}</span>
          ))}
        </div>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="studio-profile-field !mt-0">
            <span>昵称</span>
            <div className="invite-input-wrap">
              <UserRound size={19} />
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={32}
                placeholder="协作者昵称"
              />
            </div>
          </label>
          <label className="studio-profile-field !mt-0">
            <span>设置密码</span>
            <div className="invite-input-wrap">
              <KeyRound size={19} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="至少 8 个字符"
              />
            </div>
          </label>
          <label className="studio-profile-field !mt-0">
            <span>确认密码</span>
            <div className="invite-input-wrap">
              <KeyRound size={19} />
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="再次输入密码"
              />
            </div>
          </label>
          <p className="text-[13px] leading-5 text-[var(--muted-faint)]">
            邀请将在 {formatDateTime(invite.expiresAt)} 过期。
          </p>
          <button
            type="submit"
            className="studio-primary-button h-11 w-full"
            disabled={loading}
          >
            {loading && <LoaderCircle className="animate-spin" size={19} />}
            激活协作账号
          </button>
        </form>
      </div>
    </main>
  )
}

function InviteState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <main className="invite-accept-page">
      <div className="invite-state-card">
        <p className="section-kicker">Collaboration invitation</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <Link to="/studio/login" className="studio-primary-button mt-6">
          前往登录
        </Link>
      </div>
    </main>
  )
}
