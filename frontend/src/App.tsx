import { lazy, Suspense, useEffect } from 'react'
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom'
import { LibraryLayout } from './components/public/LibraryLayout'
import { StudioLayout } from './components/studio/StudioLayout'
import { LandingPage } from './pages/public/LandingPage'
import { CategoryPage } from './pages/public/CategoryPage'
import { LibraryIndexPage } from './pages/public/LibraryIndexPage'
import { NotFoundPage } from './pages/public/NotFoundPage'
import { CollaborationInvitePage } from './pages/public/CollaborationInvitePage'
import { ComponentGalleryPage } from './pages/public/ComponentGalleryPage'
import { PublicShellFixturePage } from './pages/public/PublicShellFixturePage'
import { SearchResultsPage } from './pages/public/SearchResultsPage'
import { StudioDashboardPage } from './pages/studio/StudioDashboardPage'
import { CategoryManagementPage } from './pages/studio/CategoryManagementPage'
import { CollaborationManagementPage } from './pages/studio/CollaborationManagementPage'
import { AnalyticsPage } from './pages/studio/AnalyticsPage'
import { StudioLoginPage } from './pages/studio/StudioLoginPage'
import { StudioSettingsPage } from './pages/studio/StudioSettingsPage'
import { StudioShellFixturePage } from './pages/studio/StudioShellFixturePage'
import { TrashPage } from './pages/studio/TrashPage'
import { useSiteStore } from './store/siteStore'

const NotePage = lazy(() =>
  import('./pages/public/NotePage').then((module) => ({
    default: module.NotePage,
  })),
)

const StudioNotePage = lazy(() =>
  import('./pages/studio/StudioNotePage').then((module) => ({
    default: module.StudioNotePage,
  })),
)

function StudioNoteRoute() {
  const { noteId } = useParams()
  return <StudioNotePage key={noteId ?? 'missing'} />
}

function ProtectedStudio() {
  const studioAuthed = useSiteStore((state) => state.studioAuthed)
  const location = useLocation()
  return studioAuthed ? (
    <Outlet />
  ) : (
    <Navigate
      to="/studio/login"
      state={{ from: location.pathname }}
      replace
    />
  )
}

function OwnerOnly() {
  const studioRole = useSiteStore((state) => state.studioRole)
  return studioRole === 'owner' ? (
    <Outlet />
  ) : (
    <Navigate to="/studio" replace />
  )
}

export default function App() {
  const themeMode = useSiteStore((state) => state.themeMode)

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode
    document.documentElement.style.colorScheme = themeMode
  }, [themeMode])

  return (
    <Suspense
      fallback={
        <div className="page-loader">
          <span />
          正在展开页面
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/visual-fixtures/components"
          element={<ComponentGalleryPage />}
        />
        <Route element={<LibraryLayout />}>
          <Route
            path="/visual-fixtures/public-shell"
            element={<PublicShellFixturePage />}
          />
          <Route path="/library" element={<LibraryIndexPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route
            path="/library/:categorySlug"
            element={<CategoryPage />}
          />
          <Route
            path="/library/:categorySlug/:noteSlug"
            element={<NotePage />}
          />
        </Route>

        <Route
          path="/collaborate/accept/:token"
          element={<CollaborationInvitePage />}
        />
        <Route path="/studio/login" element={<StudioLoginPage />} />
        <Route element={<ProtectedStudio />}>
          <Route element={<StudioLayout />}>
            <Route
              path="/studio/visual-fixtures/shell"
              element={<StudioShellFixturePage />}
            />
            <Route path="/studio" element={<StudioDashboardPage />} />
            <Route path="/studio/notes/:noteId" element={<StudioNoteRoute />} />
            <Route path="/studio/trash" element={<TrashPage />} />
            <Route element={<OwnerOnly />}>
              <Route
                path="/studio/categories"
                element={<CategoryManagementPage />}
              />
              <Route
                path="/studio/collaboration"
                element={<CollaborationManagementPage />}
              />
              <Route path="/studio/analytics" element={<AnalyticsPage />} />
              <Route path="/studio/settings" element={<StudioSettingsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
