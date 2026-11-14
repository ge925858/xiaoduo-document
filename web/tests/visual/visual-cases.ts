export const visualViewports = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
] as const

export const visualOrigins = {
  prototype: 'http://127.0.0.1:4273',
  production: 'http://127.0.0.1:3200',
} as const

export type VisualRole = 'owner' | 'collaborator' | null

export interface VisualCase {
  id: string
  prototypePath: string
  productionPath: string
  productionLogin: VisualRole
  overlay?: 'design-tokens'
  interaction?: 'open-library-sidebar' | 'open-public-search'
    | 'open-collaboration-application'
  searchQuery?: string
  viewports?: ReadonlyArray<'desktop' | 'tablet' | 'mobile'>
}

export const visualCases: VisualCase[] = [
  {
    id: 'design-tokens',
    prototypePath: '/',
    productionPath: '/',
    productionLogin: null,
    overlay: 'design-tokens',
  },
  {
    id: 'component-gallery',
    prototypePath: '/visual-fixtures/components',
    productionPath: '/visual-fixtures/components',
    productionLogin: null,
  },
  {
    id: 'public-shell',
    prototypePath: '/visual-fixtures/public-shell',
    productionPath: '/visual-fixtures/public-shell',
    productionLogin: null,
  },
  {
    id: 'public-shell-mobile-nav',
    prototypePath: '/visual-fixtures/public-shell',
    productionPath: '/visual-fixtures/public-shell',
    productionLogin: null,
    interaction: 'open-library-sidebar',
    viewports: ['mobile'],
  },
  {
    id: 'public-not-found',
    prototypePath: '/visual-fixtures/missing-page',
    productionPath: '/visual-fixtures/missing-page',
    productionLogin: null,
  },
  {
    id: 'public-search-dialog',
    prototypePath: '/visual-fixtures/public-shell',
    productionPath: '/visual-fixtures/public-shell',
    productionLogin: null,
    interaction: 'open-public-search',
    searchQuery: '写作',
  },
  {
    id: 'public-search-page',
    prototypePath: '/search?q=写作',
    productionPath: '/search?q=写作',
    productionLogin: null,
  },
  {
    id: 'public-preview',
    prototypePath: '/',
    productionPath: '/',
    productionLogin: null,
  },
  {
    id: 'library-index',
    prototypePath: '/library',
    productionPath: '/library',
    productionLogin: null,
  },
  {
    id: 'library-category',
    prototypePath: '/library/attention-and-writing',
    productionPath: '/library/attention-and-writing',
    productionLogin: null,
  },
  {
    id: 'library-chapter',
    prototypePath:
      '/library/attention-and-writing/keep-thinking-on-paper',
    productionPath:
      '/library/attention-and-writing/keep-thinking-on-paper',
    productionLogin: null,
  },
  {
    id: 'studio-login',
    prototypePath: '/studio/login',
    productionPath: '/studio/login',
    productionLogin: null,
  },
  {
    id: 'studio-shell-owner',
    prototypePath: '/studio/visual-fixtures/shell',
    productionPath: '/studio/visual-fixtures/shell',
    productionLogin: 'owner',
  },
  {
    id: 'studio-shell-collaborator',
    prototypePath: '/studio/visual-fixtures/shell',
    productionPath: '/studio/visual-fixtures/shell',
    productionLogin: 'collaborator',
  },
  {
    id: 'studio-dashboard-owner',
    prototypePath: '/studio',
    productionPath: '/studio',
    productionLogin: 'owner',
  },
  {
    id: 'studio-editor-owner',
    prototypePath: '/studio/notes/note-keep-thinking',
    productionPath: '/studio/notes/note-keep-thinking',
    productionLogin: 'owner',
  },
  {
    id: 'studio-categories-owner',
    prototypePath: '/studio/categories',
    productionPath: '/studio/categories',
    productionLogin: 'owner',
  },
  {
    id: 'studio-collaboration-owner',
    prototypePath: '/studio/collaboration',
    productionPath: '/studio/collaboration',
    productionLogin: 'owner',
  },
  {
    id: 'studio-analytics-owner',
    prototypePath: '/studio/analytics',
    productionPath: '/studio/analytics',
    productionLogin: 'owner',
  },
  {
    id: 'studio-trash-owner',
    prototypePath: '/studio/trash',
    productionPath: '/studio/trash',
    productionLogin: 'owner',
  },
  {
    id: 'studio-settings-owner',
    prototypePath: '/studio/settings',
    productionPath: '/studio/settings',
    productionLogin: 'owner',
  },
  {
    id: 'studio-dashboard-collaborator',
    prototypePath: '/studio',
    productionPath: '/studio',
    productionLogin: 'collaborator',
  },
  {
    id: 'studio-editor-collaborator',
    prototypePath: '/studio/notes/note-keep-thinking',
    productionPath: '/studio/notes/note-keep-thinking',
    productionLogin: 'collaborator',
  },
  {
    id: 'collaboration-invite',
    prototypePath: '/collaborate/accept/visual-invite-token',
    productionPath: '/collaborate/accept/visual-invite-token',
    productionLogin: null,
  },
  {
    id: 'collaboration-application-dialog',
    prototypePath:
      '/library/attention-and-writing/keep-thinking-on-paper',
    productionPath:
      '/library/attention-and-writing/keep-thinking-on-paper',
    productionLogin: null,
    interaction: 'open-collaboration-application',
  },
  {
    id: 'password-reset',
    prototypePath: '/visual-fixtures/password-reset',
    productionPath: '/collaborate/reset/visual-reset-token',
    productionLogin: null,
  },
]
