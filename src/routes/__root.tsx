import type { ReactNode } from 'react'
import '@fontsource/roboto/latin-300.css'
import '@fontsource/roboto/latin-400.css'
import '@fontsource/roboto/latin-500.css'
import '@fontsource/roboto/latin-700.css'
import CssBaseline from '@mui/material/CssBaseline'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router'
import { Button, Container, Typography } from '@mui/material'
import { blue } from '@mui/material/colors'
import { AppLayout } from '../features/global/AppLayout'

const theme = createTheme({
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  palette: {
    primary: {
      main: '#1a237e',
    },
    secondary: blue,
  },
})

export const documentHead = {
  meta: [
    {
      charSet: 'utf-8',
    },
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    },
    {
      title: "Airik's Resort",
    },
    {
      name: 'description',
      content: "Resort booking for Airik's Resort",
    },
    {
      name: 'theme-color',
      content: '#1a237e',
    },
    {
      name: 'apple-mobile-web-app-title',
      content: "Airik's Resort",
    },
  ],
  links: [
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
  ],
}

export const Route = createRootRoute({
  head: () => documentHead,
  component: RootComponent,
  errorComponent: RootErrorComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppLayout>
          <Outlet />
        </AppLayout>
      </ThemeProvider>
    </RootDocument>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootErrorComponent({ error, reset }: {
  error: Error,
  reset: () => void
}) {
  return (
    <Container
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        paddingTop: 4,
      }}
    >
      <Typography variant="h4">
        Something went wrong
      </Typography>

      <Typography>
        {error.message}
      </Typography>

      <Button
        variant="contained"
        onClick={reset}
      >
        Try Again
      </Button>
    </Container>
  )
}