import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'u', 'mark'],
  attributes: {
    ...defaultSchema.attributes,
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      ['style', /^color:\s*#[0-9a-f]{3,8}$/i],
    ],
    mark: [
      ...(defaultSchema.attributes?.mark ?? []),
      ['style', /^background-color:\s*#[0-9a-f]{3,8}$/i],
    ],
  },
}

export function MarkdownArticle({ markdown }: { markdown: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], rehypeSlug]}
        components={{
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              {...(href?.startsWith('http')
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
              {...props}
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            // Markdown images keep their source dimensions and use native lazy loading.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt ?? ''} loading="lazy" />
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
