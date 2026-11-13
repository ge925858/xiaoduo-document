import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="landing">
      <p className="eyebrow">公开知识书</p>
      <h1>知笺</h1>
      <p className="landing-lead">
        把长期思考整理成分类稳定、可追溯修订的公开知识书。
      </p>
      <Link className="landing-entry" href="/library">
        进入笔记库
      </Link>
    </main>
  )
}
