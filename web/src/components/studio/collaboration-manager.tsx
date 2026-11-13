'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Application {
  id: string
  articleTitle: string
  name: string
  email: string
  note: string
  status: string
}
interface Invite {
  id: string
  email: string
  status: string
  token?: string
}
interface Article {
  id: string
  title: string
}
interface Collaborator {
  id: string
  name: string
  email: string
}
interface ArticleGrant {
  userId: string
  userName: string
  articleId: string
  articleTitle: string
}

export function CollaborationManager({
  applications,
  invites,
  articles,
  collaborators,
  grants,
}: {
  applications: Application[]
  invites: Invite[]
  articles: Article[]
  collaborators: Collaborator[]
  grants: ArticleGrant[]
}) {
  const router = useRouter()
  const [inviteLink, setInviteLink] = useState('')
  const [message, setMessage] = useState('')

  function showInvite(token: string) {
    setInviteLink(`${window.location.origin}/collaborate/accept/${token}`)
  }

  async function review(id: string, decision: 'approve' | 'reject') {
    const response = await fetch(
      `/api/studio/collaboration/applications/${id}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ decision }),
      },
    )
    const payload = (await response.json()) as {
      invite?: { token: string }
    }
    if (payload.invite?.token) showInvite(payload.invite.token)
    setMessage(response.ok ? '审核已保存' : '审核失败')
    router.refresh()
  }

  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const response = await fetch('/api/studio/collaboration/invites', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: String(data.get('email') ?? ''),
        displayName: String(data.get('displayName') ?? ''),
        articleIds: data.getAll('articleIds').map(String),
      }),
    })
    const payload = (await response.json()) as {
      invite?: { token: string }
    }
    if (payload.invite?.token) showInvite(payload.invite.token)
    setMessage(response.ok ? '邀请已生成' : '邀请生成失败')
    router.refresh()
  }

  async function grant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const response = await fetch('/api/studio/collaboration/grants', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        userId: String(data.get('userId') ?? ''),
        articleId: String(data.get('articleId') ?? ''),
      }),
    })
    setMessage(response.ok ? '文章授权已保存' : '文章授权保存失败')
    router.refresh()
  }

  async function revoke(userId: string, articleId: string) {
    const response = await fetch('/api/studio/collaboration/grants', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId, articleId }),
    })
    setMessage(response.ok ? '文章授权已撤销' : '撤销文章授权失败')
    router.refresh()
  }

  return (
    <div className="collaboration-manager">
      {message ? <p role="status">{message}</p> : null}
      {inviteLink ? (
        <label>
          邀请链接
          <input readOnly value={inviteLink} />
        </label>
      ) : null}
      <h2>待审核申请</h2>
      {applications.map((application) => (
        <article key={application.id}>
          <strong>{application.name}</strong>
          <span>{application.email} · {application.articleTitle}</span>
          <p>{application.note}</p>
          <span>{application.status}</span>
          {application.status === 'pending' ? (
            <div className="category-actions">
              <button type="button" onClick={() => void review(application.id, 'approve')}>批准</button>
              <button type="button" onClick={() => void review(application.id, 'reject')}>拒绝</button>
            </div>
          ) : null}
        </article>
      ))}
      <h2>主动邀请</h2>
      <form className="studio-form" onSubmit={invite}>
        <label>邮箱<input name="email" type="email" required /></label>
        <label>昵称<input name="displayName" /></label>
        <label>
          授权文章
          <select name="articleIds" multiple required>
            {articles.map((article) => (
              <option key={article.id} value={article.id}>{article.title}</option>
            ))}
          </select>
        </label>
        <button type="submit">生成邀请链接</button>
      </form>
      <h2>邀请状态</h2>
      <ul>
        {invites.map((item) => (
          <li key={item.id}>{item.email} · {item.status}</li>
        ))}
      </ul>
      <h2>文章授权</h2>
      <form className="studio-form grant-form" onSubmit={grant}>
        <label>
          授权协作者
          <select name="userId" required>
            {collaborators.map((collaborator) => (
              <option key={collaborator.id} value={collaborator.id}>
                {collaborator.name} · {collaborator.email}
              </option>
            ))}
          </select>
        </label>
        <label>
          授权章节
          <select name="articleId" required>
            {articles.map((article) => (
              <option key={article.id} value={article.id}>
                {article.title}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={!collaborators.length || !articles.length}
        >
          增加文章授权
        </button>
      </form>
      <ul className="grant-list">
        {grants.map((grant) => (
          <li key={`${grant.userId}:${grant.articleId}`}>
            <span>
              {grant.userName} · {grant.articleTitle}
            </span>
            <button
              type="button"
              aria-label={`撤销 ${grant.userName} 对 ${grant.articleTitle} 的授权`}
              onClick={() => void revoke(grant.userId, grant.articleId)}
            >
              撤销授权
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
