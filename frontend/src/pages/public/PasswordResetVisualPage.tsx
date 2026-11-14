import {
  ArrowLeft,
  KeyRound,
  Mail,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export function PasswordResetVisualPage() {
  return (
    <main className="invite-accept-page">
      <div className="invite-accept-card">
        <Link to="/" className="invite-back-link">
          <ArrowLeft size={14} />
          返回知笺
        </Link>
        <p className="section-kicker mt-8">Password reset</p>
        <h1>设置新密码</h1>
        <p className="invite-accept-intro">
          为协作者账号设置一个新密码，旧会话将立即失效。
        </p>
        <div className="invite-account-email">
          <Mail size={15} />
          <span>zhou@example.com</span>
        </div>
        <form className="mt-7 space-y-4">
          <label className="studio-profile-field !mt-0">
            <span>新密码</span>
            <div className="invite-input-wrap">
              <KeyRound size={15} />
              <input
                type="password"
                placeholder="至少 8 个字符"
                readOnly
              />
            </div>
          </label>
          <label className="studio-profile-field !mt-0">
            <span>确认新密码</span>
            <div className="invite-input-wrap">
              <KeyRound size={15} />
              <input
                type="password"
                placeholder="再次输入新密码"
                readOnly
              />
            </div>
          </label>
          <p className="text-[10px] leading-5 text-[var(--muted-faint)]">
            重置链接将在 2099/11/13 21:00 过期。
          </p>
          <button
            type="button"
            className="studio-primary-button h-11 w-full"
          >
            设置新密码
          </button>
        </form>
      </div>
    </main>
  )
}
