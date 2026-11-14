import { ImagePlus, Save } from 'lucide-react'
import { AuthorAvatar } from '../../components/AuthorAvatar'
import { useSiteStore } from '../../store/siteStore'

export function StudioSettingsVisualPage() {
  const author = useSiteStore((state) => state.author)

  return (
    <div className="studio-page max-w-[860px]">
      <header className="studio-page-header">
        <div>
          <p className="section-kicker">Author profile</p>
          <h1>个人资料</h1>
          <p>昵称和头像会展示在公开章节的作者信息中。</p>
        </div>
      </header>

      <form
        className="studio-profile-form"
        onSubmit={(event) => event.preventDefault()}
      >
        <section className="studio-profile-avatar-section">
          <AuthorAvatar
            name={author.name}
            avatarUrl={author.avatarUrl}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <strong>头像</strong>
            <p>使用可公开访问的图片地址，保存后会展示在公开章节中。</p>
            <label className="studio-profile-avatar-url">
              <span>头像地址</span>
              <input
                defaultValue={author.avatarUrl ?? ''}
                placeholder="https://example.com/avatar.jpg"
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                aria-disabled="true"
                className="studio-secondary-button pointer-events-none opacity-50 data-[enabled=true]:pointer-events-auto data-[enabled=true]:opacity-100"
                data-enabled="false"
              >
                <ImagePlus size={14} />
                预览头像
              </a>
            </div>
          </div>
        </section>

        <div className="studio-profile-fields">
          <label className="studio-profile-field">
            <span>作者昵称</span>
            <input defaultValue={author.name} />
          </label>
          <label className="studio-profile-field">
            <span>身份说明</span>
            <input defaultValue={author.role} />
          </label>
          <label className="studio-profile-field">
            <span>所在城市</span>
            <input defaultValue={author.location} />
          </label>
          <label className="studio-profile-field">
            <span>联系邮箱</span>
            <input type="email" defaultValue={author.email} />
          </label>
          <label className="studio-profile-field sm:col-span-2">
            <span>简介</span>
            <textarea rows={4} defaultValue={author.intro} />
          </label>
          <label className="studio-profile-field sm:col-span-2">
            <span>最近在做什么</span>
            <textarea rows={3} defaultValue={author.now} />
          </label>
        </div>

        <div className="studio-profile-actions">
          <button type="submit" className="studio-primary-button">
            <Save size={15} />
            保存站点资料
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
