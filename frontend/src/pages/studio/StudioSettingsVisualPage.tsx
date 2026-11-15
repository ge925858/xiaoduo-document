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
            <p>从本地选择方形图片。对象存储接入前仅显示临时预览。</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="studio-secondary-button"
              >
                <ImagePlus size={18} />
                选择本地头像
              </button>
            </div>
          </div>
        </section>

        <div className="studio-profile-fields">
          <label className="studio-profile-field sm:col-span-2">
            <span>作者昵称</span>
            <input defaultValue={author.name} />
          </label>
        </div>

        <div className="studio-profile-actions">
          <button type="submit" className="studio-primary-button">
            <Save size={19} />
            保存资料
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
