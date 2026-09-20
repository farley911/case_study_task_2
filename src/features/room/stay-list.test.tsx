import { beforeEach, describe, expect, test } from '@jest/globals'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import fetchMock from 'jest-fetch-mock'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { AppLayout } from '../global/AppLayout'
import { useBooking } from '../global/BookingContext'
import { HomePage } from '../../routes/index'
import type { Stay } from '../../types/api'

const calendarDayFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const firstStay: Stay = {
  id: 1,
  room_type: 'king_suite',
  name: 'Premier King Suite',
  description: '725 sq ft · 1 King Bed',
  photos: ['https://example.com/king-suite.jpg'],
  price: 100,
}

const updatedStay: Stay = {
  ...firstStay,
  id: 2,
  room_type: 'queen_suite',
  name: 'Premier Queen Suite',
}

function renderBookingApp() {
  const rootRoute = createRootRoute({
    component: () => (
      <AppLayout>
        <Outlet />
      </AppLayout>
    ),
  })
  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: HomePage,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([homeRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })

  return render(<RouterProvider router={router} />)
}

async function selectDay(
  user: ReturnType<typeof userEvent.setup>,
  day: number,
) {
  const today = new Date()
  const date = new Date(today.getFullYear(), today.getMonth(), day)
  await user.click(await screen.findByRole('button', {
    name: `Choose ${calendarDayFormatter.format(date)}`,
  }))
}

beforeEach(() => {
  fetchMock.resetMocks()
})

describe('Stay list', () => {
  test('Placeholder is shown', async () => {
    renderBookingApp()

    expect(await screen.findByText(
      'Please select a date range to view available stays',
    )).toBeInTheDocument()
  })

  test('Search results and loaders are displayed', async () => {
    const user = userEvent.setup()
    let resolveResponse = (_body: string) => undefined
    const responseBody = new Promise<string>((resolve) => {
      resolveResponse = resolve
    })
    fetchMock.mockResponseOnce(() => responseBody)
    renderBookingApp()

    await selectDay(user, 4)
    await selectDay(user, 7)

    expect(screen.getByLabelText('Loading available stays')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: /available stays/i }))
      .not.toBeInTheDocument()

    resolveResponse(JSON.stringify([firstStay, updatedStay]))

    const results = await screen.findByRole('list', { name: /available stays/i })
    expect(screen.queryByLabelText('Loading available stays'))
      .not.toBeInTheDocument()
    expect(within(results).getAllByRole('listitem')).toHaveLength(2)
    expect(within(results).getAllByText('$300.00')).toHaveLength(2)
  })

  test('Stays are updated when the search changes', async () => {
    const user = userEvent.setup()
    fetchMock
      .mockResponseOnce(JSON.stringify([firstStay]))
      .mockResponseOnce(JSON.stringify([updatedStay]))
    renderBookingApp()

    await selectDay(user, 4)
    await selectDay(user, 7)
    expect(await screen.findByText(firstStay.name)).toBeInTheDocument()

    await user.click(screen.getByRole('combobox', { name: /guests/i }))
    await user.click(screen.getByRole('option', { name: '4' }))

    expect(await screen.findByText(updatedStay.name)).toBeInTheDocument()
    expect(screen.queryByText(firstStay.name)).not.toBeInTheDocument()
  })

  test('Selecting a room updates the shared cart without another request', async () => {
    const user = userEvent.setup()
    fetchMock.mockResponseOnce(JSON.stringify([firstStay]))
    renderBookingApp()

    await selectDay(user, 4)
    await selectDay(user, 7)
    await screen.findByText(firstStay.name)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: /select room/i }))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', {
      name: /shopping cart, 1 items/i,
    })).toBeInTheDocument()
  })

  test('Booking state requires its shared provider', () => {
    function UnwrappedConsumer() {
      useBooking()
      return null
    }

    expect(() => render(<UnwrappedConsumer />)).toThrow(
      'useBooking must be used within a BookingProvider.',
    )
  })

  test('Responsive results use a wrapping grid', async () => {
    const user = userEvent.setup()
    fetchMock.mockResponseOnce(JSON.stringify([firstStay, updatedStay]))
    renderBookingApp()

    await selectDay(user, 4)
    await selectDay(user, 7)

    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(2)
    })
    expect(screen.getByRole('list', { name: /available stays/i }))
      .toHaveClass('MuiBox-root')
  })
})
