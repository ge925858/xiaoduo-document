'use client'

import { ImagePlus, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { AuthorAvatar } from '@/components/author-avatar'

interface ProfileValues {
  authorName: string
  avatarUrl: string
  roleTitle: string
  intro: string
  nowText: string
  location: string
  email: string
}

export function ProfileForm({ initial }: { initial: ProfileValues }) {
  const [values, setValues] = useState(initial)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  function field(name: keyof ProfileValues) {
    return {
      value: values[name],
      onChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => {
        setValues((current) => ({
          ...current,
          [name]: event.target.value,
        }))
      },
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage('')
    const response = await fetch('/api/studio/profile', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(values),
    })
    setPending(false)
    setMessage(response.ok ? '站点资料已保存' : '保存失败，请重试。')
  }

  return (
    <div className="studio-page max-w-[860px]">
      <header className="studio-page-header">
        <div>
          <p className="section-kicker">Author profile</p>
          <h1>个人资料</h1>
          <p>昵称和头像会展示在公开章节的作者信息中。</p>
        </div>
      </header>

      <form className="studio-profile-form" onSubmit={save}>
        <section className="studio-profile-avatar-section">
          <AuthorAvatar
            name={values.authorName || '作者'}
            avatarUrl={values.avatarUrl}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <strong>头像</strong>
            <p>使用可公开访问的图片地址，保存后会展示在公开章节中。</p>
            <label className="studio-profile-avatar-url">
              <span>头像地址</span>
              <input
                {...field('avatarUrl')}
                placeholder="https://example.com/avatar.jpg"
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={values.avatarUrl || undefined}
                target="_blank"
                rel="noreferrer"
                className="studio-secondary-button pointer-events-none opacity-50 data-[enabled=true]:pointer-events-auto data-[enabled=true]:opacity-100"
                data-enabled={Boolean(values.avatarUrl)}
              >
                <ImagePlus size={18} />
                预览头像
              </a>
              {values.avatarUrl ? (
                <button
                  type="button"
                  className="studio-secondary-button hover:!text-[var(--rust)]"
                  onClick={() =>
                    setValues((current) => ({
                      ...current,
                      avatarUrl: '',
                    }))
                  }
                >
                  <Trash2 size={18} />
                  移除头像
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <div className="studio-profile-fields">
          <label className="studio-profile-field">
            <span>作者昵称</span>
            <input {...field('authorName')} required maxLength={32} />
          </label>
          <label className="studio-profile-field">
            <span>身份说明</span>
            <input {...field('roleTitle')} required />
          </label>
          <label className="studio-profile-field">
            <span>所在城市</span>
            <input {...field('location')} />
          </label>
          <label className="studio-profile-field">
            <span>联系邮箱</span>
            <input type="email" {...field('email')} required />
          </label>
          <label className="studio-profile-field sm:col-span-2">
            <span>简介</span>
            <textarea rows={4} {...field('intro')} />
          </label>
          <label className="studio-profile-field sm:col-span-2">
            <span>最近在做什么</span>
            <textarea rows={3} {...field('nowText')} />
          </label>
        </div>

        {message ? (
          <p
            role={message === '站点资料已保存' ? 'status' : 'alert'}
            className={
              message === '站点资料已保存'
                ? 'profile-success'
                : 'profile-error'
            }
          >
            {message}
          </p>
        ) : null}

        <div className="studio-profile-actions">
          <button type="submit" className="studio-primary-button" disabled={pending}>
            <Save size={19} />
            {pending ? '正在保存…' : '保存站点资料'}
          </button>
        </div>
      </form>

      <section className="export-panel">
        <div>
          <p className="section-kicker">Portable backup</p>
          <h2>整站导出</h2>
          <p>下载分类顺序、Markdown 正文、状态、版本和协作元数据。</p>
        </div>
        <a href="/api/studio/export" download>
          下载整站导出 ZIP
        </a>
      </section>
    </div>
  )
}
