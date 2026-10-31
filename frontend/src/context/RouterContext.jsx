import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const RouterContext = createContext({
  path: '/',
  search: '',
  params: {},
  navigate: () => {},
})

/**
 * Parses route pattern like '/app/interviews/:sessionId/report' against current path
 */
function matchPath(pattern, pathname) {
  if (pattern === pathname) return { matched: true, params: {} }

  // Normalize slashes
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = pathname.split('/').filter(Boolean)

  if (patternParts.length !== pathParts.length) return { matched: false, params: {} }

  const params = {}
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i]
    const pathPart = pathParts[i]

    if (patternPart.startsWith(':')) {
      const paramName = patternPart.slice(1)
      params[paramName] = decodeURIComponent(pathPart)
    } else if (patternPart !== pathPart) {
      return { matched: false, params: {} }
    }
  }

  return { matched: true, params }
}

export function RouterProvider({ children }) {
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/'
    }
    return '/'
  })

  const [currentSearch, setCurrentSearch] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.search || ''
    }
    return ''
  })

  const [params, setParams] = useState({})

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/')
      setCurrentSearch(window.location.search || '')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = useCallback((to, options = {}) => {
    if (typeof window === 'undefined') return

    // External URL handling
    if (typeof to === 'string' && (to.startsWith('http://') || to.startsWith('https://') || to.startsWith('mailto:'))) {
      window.location.href = to
      return
    }

    const [targetPath, targetSearch = ''] = (to || '/').split('?')

    if (options.replace) {
      window.history.replaceState(null, '', to)
    } else {
      window.history.pushState(null, '', to)
    }

    setCurrentPath(targetPath)
    setCurrentSearch(targetSearch ? `?${targetSearch}` : '')

    if (!options.preventScroll) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [])

  const value = useMemo(
    () => ({
      path: currentPath,
      search: currentSearch,
      params,
      setParams,
      navigate,
    }),
    [currentPath, currentSearch, params, navigate]
  )

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export function useRouter() {
  const context = useContext(RouterContext)
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider')
  }
  return context
}

export function useParams() {
  const { params } = useRouter()
  return params
}

export function useNavigate() {
  const { navigate } = useRouter()
  return navigate
}

export function useLocation() {
  const { path, search } = useRouter()
  return { pathname: path, search }
}

export function Link({ to, children, className = '', activeClassName = '', onClick, target, rel, ...props }) {
  const { path, navigate } = useRouter()
  const isExternal = typeof to === 'string' && (to.startsWith('http://') || to.startsWith('https://') || to.startsWith('mailto:'))
  const isActive = path === to || (to !== '/' && path.startsWith(to))

  const handleClick = (e) => {
    if (onClick) onClick(e)

    // Let browser handle cmd/ctrl/shift clicks for opening in new tabs
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || target === '_blank') {
      return
    }

    if (!isExternal) {
      e.preventDefault()
      navigate(to)
    }
  }

  const computedClassName = typeof className === 'function' ? className({ isActive }) : `${className} ${isActive ? activeClassName : ''}`

  return (
    <a href={to} onClick={handleClick} className={computedClassName} target={target} rel={isExternal ? 'noopener noreferrer' : rel} {...props}>
      {children}
    </a>
  )
}

export function Route({ path, element }) {
  // Evaluated by Routes parent
  return null
}

export function Routes({ children }) {
  const { path, setParams } = useRouter()

  const childrenArray = React.Children.toArray(children)

  for (const child of childrenArray) {
    if (!React.isValidElement(child)) continue

    const pattern = child.props.path
    if (!pattern) continue

    // Wildcard 404
    if (pattern === '*') {
      return child.props.element
    }

    const { matched, params: extractedParams } = matchPath(pattern, path)
    if (matched) {
      // Sync dynamic route params if changed
      setTimeout(() => setParams(extractedParams), 0)
      return child.props.element
    }
  }

  return null
}

export function Navigate({ to, replace = true }) {
  const { navigate } = useRouter()

  useEffect(() => {
    navigate(to, { replace })
  }, [to, replace, navigate])

  return null
}

