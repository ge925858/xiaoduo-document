'use client'

import { useState } from 'react'
import { Bold, Loader2 } from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { AuthorAvatar } from '@/components/author-avatar'
import { Button, IconButton } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { StudioSelect } from '@/components/ui/studio-select'
import { Hint } from '@/components/ui/tooltip'

const statusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '已发布' },
  { value: 'unpublished', label: '已撤回' },
]

export function ComponentGallery() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [status, setStatus] = useState('draft')

  return (
    <main className="component-gallery">
      <header className="component-gallery-header">
        <BrandMark />
        <div>
          <p className="section-kicker">Shared components</p>
          <h1 className="font-display">写作台的基础动作</h1>
          <p>按钮、对话框、提示、选择器与身份标记共用同一套视觉规则。</p>
        </div>
      </header>

      <section className="component-gallery-section">
        <h2>按钮</h2>
        <div className="component-gallery-row">
          <Button>保存草稿</Button>
          <Button variant="secondary">保存版本</Button>
          <Button variant="outline">取消</Button>
          <Button variant="ghost">稍后处理</Button>
          <Button variant="danger">移入回收站</Button>
          <Button disabled aria-busy="true">
            <Loader2 className="gallery-spin" size={19} />
            正在保存
          </Button>
          <Button disabled>不可用</Button>
        </div>
      </section>

      <section className="component-gallery-grid">
        <article className="component-gallery-card">
          <p className="section-kicker">Dialog</p>
          <h2>需要确认的动作</h2>
          <p>打开后焦点进入对话框，按 Esc 关闭并返回触发按钮。</p>
          <Button onClick={() => setDialogOpen(true)}>打开对话框</Button>
        </article>

        <article className="component-gallery-card">
          <p className="section-kicker">Tooltip & select</p>
          <h2>工具栏与状态</h2>
          <div className="component-gallery-inline">
            <Hint label="支持 Markdown 快捷输入">
              <IconButton label="查看格式提示">
                <Bold size={20} />
              </IconButton>
            </Hint>
            <StudioSelect
              ariaLabel="章节状态"
              value={status}
              options={statusOptions}
              onChange={setStatus}
            />
          </div>
        </article>

        <article className="component-gallery-card">
          <p className="section-kicker">Identity</p>
          <h2>作者身份</h2>
          <div className="component-gallery-avatars">
            <AuthorAvatar name="林默" size="sm" />
            <AuthorAvatar name="林默" size="md" />
            <AuthorAvatar name="林默" size="lg" />
            <BrandMark compact />
          </div>
        </article>

        <article className="component-gallery-card">
          <p className="section-kicker">Feedback</p>
          <h2>错误不会丢失上下文</h2>
          <p className="gallery-error" role="alert">
            图片上传失败，草稿仍保留在本地。
          </p>
          <Button variant="outline">重新上传</Button>
        </article>
      </section>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="组件对话框"
        description="键盘焦点只会在当前任务内移动。"
      >
        <div className="gallery-dialog-body">
          <label>
            版本说明
            <input defaultValue="整理第二段论证" />
          </label>
          <div className="component-gallery-dialog-actions">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={() => setDialogOpen(false)}>保存版本</Button>
          </div>
        </div>
      </Dialog>
    </main>
  )
}
