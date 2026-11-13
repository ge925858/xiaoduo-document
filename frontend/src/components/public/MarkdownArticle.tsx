import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeSlug from 'rehype-slug'

const markdownSanitizeSchema = {
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
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, markdownSanitizeSchema],
          rehypeSlug,
        ]}
        components={{
          a: ({ href, children, ...props }) => {
            const external = href?.startsWith('http')
            return (
              <a
                href={href}
                {...(external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                {...props}
              >
                {children}
              </a>
            )
          },
          img: ({ src, alt }) => (
            <img src={src} alt={alt ?? ''} loading="lazy" />
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
