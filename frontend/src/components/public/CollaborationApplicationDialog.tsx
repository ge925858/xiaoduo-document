import { useState, type FormEvent } from 'react'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { useSiteStore } from '../../store/siteStore'
import { Dialog } from '../ui/Dialog'

export function CollaborationApplicationDialog({
  open,
  onOpenChange,
  noteId,
  noteTitle,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  noteId: string
  noteTitle: string
}) {
  const submitApplication = useSiteStore(
    (state) => state.submitCollaborationApplication,
  )
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const result = submitApplication({ noteId, name, email, note })
    if (result === 'invalid') {
      toast.error('请填写昵称、有效邮箱和申请说明')
      return
    }
    if (result === 'duplicate') {
      toast.info('这篇文章已经收到你的申请，请等待站主审核')
      return
    }
    setName('')
    setEmail('')
    setNote('')
    onOpenChange(false)
    toast.success('申请已提交，审核结果将由站主处理')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="申请参与编辑"
      description={`申请将关联《${noteTitle}》，审核通过后才会收到邀请。`}
    >
      <form onSubmit={submit} className="collaboration-application-form">
        <label>
          <span>昵称</span>
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={32}
            placeholder="怎么称呼你"
          />
        </label>
        <label>
          <span>邮箱</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="用于接收邀请和登录"
          />
        </label>
        <label>
          <span>申请说明</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            maxLength={500}
            placeholder="简单说明你希望补充或修改的内容"
          />
        </label>
        <p className="collaboration-form-hint">
          此时不会创建账号，也不需要设置密码。审核通过后，站主会生成一次性邀请链接。
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="studio-secondary-button"
            onClick={() => onOpenChange(false)}
          >
            取消
          </button>
          <button type="submit" className="studio-primary-button">
            <Send size={14} />
            提交申请
          </button>
        </div>
      </form>
    </Dialog>
  )
}
