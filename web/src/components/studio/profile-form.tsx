'use client'

import { useState } from 'react'

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
    <form className="studio-form profile-form" onSubmit={save}>
      <label>
        作者昵称
        <input name="authorName" required {...field('authorName')} />
      </label>
      <label>
        头像地址
        <input name="avatarUrl" {...field('avatarUrl')} />
      </label>
      <label>
        身份说明
        <input name="roleTitle" required {...field('roleTitle')} />
      </label>
      <label>
        所在城市
        <input name="location" {...field('location')} />
      </label>
      <label>
        联系邮箱
        <input name="email" type="email" required {...field('email')} />
      </label>
      <label>
        简介
        <textarea name="intro" rows={4} {...field('intro')} />
      </label>
      <label>
        最近在做什么
        <textarea name="nowText" rows={3} {...field('nowText')} />
      </label>
      {message ? <p role="status">{message}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? '正在保存…' : '保存站点资料'}
      </button>
    </form>
  )
}
