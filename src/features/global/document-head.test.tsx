import { describe, expect, test } from '@jest/globals'
import { render, screen, within } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { getRouter } from '../../router'
import { HomePage } from '../../routes/index'
import { documentHead } from '../../routes/__root'
import { AppLayout } from './AppLayout'

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
})

function renderHomeLayout() {
  const rootRoute = createRootRoute({
    component: () => (
      <ThemeProvider theme={theme}>
        <AppLayout>
          <Outlet />
        </AppLayout>
      </ThemeProvider>
    ),
  })

  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: HomePage,
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([homeRoute]),
    history: createMemoryHistory({
      initialEntries: ['/'],
    }),
  })

  return render(<RouterProvider router={router} />)
}

describe('application foundation', () => {
  test('Header is shown', async () => {
    renderHomeLayout()

    expect(
      await screen.findByText(/please select a date range/i),
    ).toBeInTheDocument()

    const header = screen.getByRole('banner', {
      name: /application header/i,
    })

    expect(header).toBeInTheDocument()
    expect(
      within(header).getByRole('img', { name: /airik's resort/i }),
    ).toBeInTheDocument()
    expect(within(header).getByText(/las vegas/i)).toBeInTheDocument()
    expect(
      within(header).getByRole('img', { name: /shopping cart/i }),
    ).toBeInTheDocument()
  })

  test('Search and stay list placeholder are provided', async () => {
    renderHomeLayout()

    expect(
      await screen.findByRole('search', { name: /search stays/i }),
    ).toHaveTextContent('Find your stay')
    expect(
      screen.getByRole('button', { name: /stay dates/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /guests/i })).toHaveTextContent('2')
    expect(screen.getByRole('main')).toHaveTextContent(
      'Please select a date range to view available stays',
    )
  })

  test('Footer is provided', async () => {
    renderHomeLayout()

    await screen.findByText(/please select a date range/i)

    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveTextContent(
      '*Taxes are not included. Prices shown are the lowest available for each night. Prices shown may be available only with multi-night stays or arrival on a specific day.',
    )
    expect(footer).toHaveTextContent(
      'Copyright © 2026 Airik Resorts International. All rights reserved.',
    )
  })

  test('App wrapper is responsive', async () => {
    renderHomeLayout()

    await screen.findByText(/please select a date range/i)

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 320,
    })
    window.dispatchEvent(new Event('resize'))

    expect(
      screen.getByRole('banner', { name: /application header/i }),
    ).toHaveStyle({
      width: '100%',
      overflowX: 'auto',
      whiteSpace: 'nowrap',
    })
    expect(screen.getByRole('search')).toHaveStyle({ width: '100%' })
    expect(screen.getByRole('main')).toHaveStyle({ width: '100%' })
    expect(screen.getByRole('contentinfo')).toHaveStyle({
      width: '100%',
      overflowWrap: 'anywhere',
      whiteSpace: 'normal',
    })

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1280,
    })
    window.dispatchEvent(new Event('resize'))

    expect(
      screen.getByRole('banner', { name: /application header/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  test('Favicons are provided', () => {
    expect(documentHead.meta).toEqual(
      expect.arrayContaining([
        { title: "Airik's Resort" },
        {
          name: 'description',
          content: "Resort booking for Airik's Resort",
        },
        { name: 'theme-color', content: '#1a237e' },
        {
          name: 'apple-mobile-web-app-title',
          content: "Airik's Resort",
        },
      ]),
    )

    expect(documentHead.links).toEqual(
      expect.arrayContaining([
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '96x96',
          href: '/favicon-96x96.png',
        },
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/favicon.svg',
        },
        {
          rel: 'shortcut icon',
          href: '/favicon.ico',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png',
        },
        {
          rel: 'manifest',
          href: '/site.webmanifest',
        },
      ]),
    )
  })

  test('creates the application router', () => {
    expect(getRouter()).toBeDefined()
  })
})
