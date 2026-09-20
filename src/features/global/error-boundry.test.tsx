import { describe, expect, test } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createMemoryHistory,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { Route as rootRoute } from '../../routes/__root'

describe('error boundary', () => {
  test('renders the error UI when a route throws', async () => {
    const brokenRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
      component: () => {
        throw new Error('Test failure')
      },
    })

    const router = createRouter({
      routeTree: rootRoute.addChildren([brokenRoute]),
      history: createMemoryHistory({
        initialEntries: ['/'],
      }),
    })

    render(<RouterProvider router={router} />)

    expect(
      await screen.findByRole('heading', {
        name: /something went wrong/i,
      }),
    ).toBeInTheDocument()

    expect(screen.getByText('Test failure')).toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: /try again/i }),
    )
  })
})
