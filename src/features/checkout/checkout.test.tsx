import { beforeEach, describe, expect, test } from '@jest/globals'
import { act, render, screen, waitFor, within } from '@testing-library/react'
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
import Button from '@mui/material/Button'
import { AppLayout } from '../global/AppLayout'
import { useBooking, type CartItemInput } from '../global/BookingContext'
import { ConfirmationRoutePage } from '../../routes/confirmation'
import { Route as checkoutLazyRoute } from '../../routes/checkout.lazy'
import type { Booking, Stay } from '../../types/api'
import { CheckoutPage } from './CheckoutPage'

const kingSuite: Stay = {
  description: 'A spacious suite with a king bed.',
  id: 1,
  name: 'Premier King Suite',
  photos: ['https://example.com/king-suite.jpg'],
  price: 100,
  room_type: 'king_suite',
}

const queenSuite: Stay = {
  description: 'A spacious suite with two queen beds.',
  id: 2,
  name: 'Premier Queen Suite',
  photos: ['https://example.com/queen-suite.jpg'],
  price: 200,
  room_type: 'queen_suite',
}

const kingCartItem: CartItemInput = {
  fromDate: '2026-09-04',
  guests: 2,
  stay: kingSuite,
  toDate: '2026-09-07',
  totalPrice: 300,
}

const queenCartItem: CartItemInput = {
  fromDate: '2026-10-10',
  guests: 1,
  stay: queenSuite,
  toDate: '2026-10-11',
  totalPrice: 200,
}

function CheckoutHarness() {
  const { addToCart } = useBooking()

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          addToCart(kingCartItem)
        }}
      >
        Add king suite
      </Button>
      <Button
        type="button"
        onClick={() => {
          addToCart(queenCartItem)
        }}
      >
        Add queen suite
      </Button>
    </>
  )
}

async function renderCheckoutApp(initialEntry = '/') {
  const rootRoute = createRootRoute({
    component: () => (
      <AppLayout>
        <Outlet />
      </AppLayout>
    ),
  })
  const homeRoute = createRoute({
    component: CheckoutHarness,
    getParentRoute: () => rootRoute,
    path: '/',
  })
  const checkoutRoute = createRoute({
    component: CheckoutPage,
    getParentRoute: () => rootRoute,
    path: '/checkout',
  })
  const confirmationRoute = createRoute({
    component: ConfirmationRoutePage,
    getParentRoute: () => rootRoute,
    path: '/confirmation',
  })
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    routeTree: rootRoute.addChildren([
      homeRoute,
      checkoutRoute,
      confirmationRoute,
    ]),
  })
  await router.load()

  return {
    router,
    ...render(<RouterProvider router={router} />),
  }
}

async function goToCheckout(
  user: ReturnType<typeof userEvent.setup>,
  rooms: 'king' | 'both' = 'king',
) {
  await user.click(screen.getByRole('button', { name: /add king suite/i }))
  if (rooms === 'both') {
    await user.click(screen.getByRole('button', { name: /add queen suite/i }))
  }
  await user.click(screen.getByRole('button', {
    name: /shopping cart, \d+ items/i,
  }))
  const cart = await screen.findByRole('dialog', { name: /shopping cart/i })
  await user.click(within(cart).getByRole('button', { name: /checkout/i }))
  await screen.findByRole('heading', { name: /review reservation/i })
}

async function fillValidDetails(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/guest name/i), 'Eric Guest')
  await user.type(screen.getByLabelText(/^address/i), '1 Resort Way')
  await user.type(screen.getByLabelText(/card number/i), '424242424242')
  await user.type(screen.getByLabelText(/expiry/i), '12/30')
  await user.type(screen.getByLabelText(/security code/i), '123')
}

function bookingFor(
  item: CartItemInput,
  id: number,
  confirmationNumber: number,
): Booking {
  return {
    address: '1 Resort Way',
    confirmationNumber,
    from_date: item.fromDate,
    guests: item.guests,
    id,
    name: 'Eric Guest',
    room_type: item.stay.room_type,
    to_date: item.toDate,
  }
}

beforeEach(() => {
  fetchMock.resetMocks()
})

describe('Checkout', () => {
  test('Checkout route is defined', async () => {
    expect(checkoutLazyRoute.options.component).toBe(CheckoutPage)

    const user = userEvent.setup()
    const { router } = await renderCheckoutApp()

    await goToCheckout(user, 'both')

    expect(router.state.location.pathname).toBe('/checkout')
    expect(screen.getByRole('heading', { name: /mock payment/i }))
      .toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: /payment details/i }))
      .toBeInTheDocument()
    const rooms = screen.getByRole('list', { name: /rooms in checkout/i })
    expect(within(rooms).getAllByRole('listitem')).toHaveLength(2)
    expect(within(rooms).getByText(kingSuite.name)).toBeInTheDocument()
    expect(within(rooms).getByText(queenSuite.name)).toBeInTheDocument()
    expect(within(rooms).getByText('Sep 4, 2026 – Sep 7, 2026'))
      .toBeInTheDocument()
    expect(within(rooms).getByText('2 guests')).toBeInTheDocument()
    expect(within(rooms).getByText('1 guest')).toBeInTheDocument()

    const kingPrice = within(rooms).getByRole('group', {
      name: /premier king suite price breakdown/i,
    })
    expect(within(kingPrice).getByText('3 nights × $100.00'))
      .toBeInTheDocument()
    expect(within(kingPrice).getAllByText('$300.00')).toHaveLength(2)

    const queenPrice = within(rooms).getByRole('group', {
      name: /premier queen suite price breakdown/i,
    })
    expect(within(queenPrice).getByText('1 night × $200.00'))
      .toBeInTheDocument()
    expect(screen.getByRole('group', { name: /checkout total/i }))
      .toHaveTextContent('Grand total$500.00')
    expect(screen.getByText('*Excluding taxes')).toBeInTheDocument()
    expect(screen.queryByText(/trip enhancements/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/check-in/i)).not.toBeInTheDocument()
  })

  test('Removing a room', async () => {
    const user = userEvent.setup()
    const { router } = await renderCheckoutApp()
    await goToCheckout(user, 'both')

    await user.click(screen.getByRole('button', {
      name: /remove premier king suite/i,
    }))

    expect(screen.queryByText(kingSuite.name)).not.toBeInTheDocument()
    expect(screen.getByText(queenSuite.name)).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /checkout total/i }))
      .toHaveTextContent('Grand total$200.00')

    await user.click(screen.getByRole('button', {
      name: /remove premier queen suite/i,
    }))
    expect(screen.getByRole('heading', { name: /checkout is empty/i }))
      .toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /find a room/i }))
    expect(router.state.location.pathname).toBe('/')
  })

  test('Payment is invalid', async () => {
    const user = userEvent.setup()
    await renderCheckoutApp()
    await goToCheckout(user)
    const confirmButton = screen.getByRole('button', {
      name: /confirm booking/i,
    })

    await user.click(confirmButton)
    expect(await screen.findByRole('alert')).toHaveTextContent(/correct/i)

    await user.type(screen.getByLabelText(/guest name/i), 'Eric Guest')
    await user.click(confirmButton)

    await user.type(screen.getByLabelText(/^address/i), '1 Resort Way')
    await user.type(screen.getByLabelText(/card number/i), 'not a card')
    await user.click(confirmButton)

    await user.clear(screen.getByLabelText(/card number/i))
    await user.type(screen.getByLabelText(/card number/i), '424242424242')
    await user.type(screen.getByLabelText(/expiry/i), '20/30')
    await user.click(confirmButton)

    await user.clear(screen.getByLabelText(/expiry/i))
    await user.type(screen.getByLabelText(/expiry/i), '12/30')
    await user.type(screen.getByLabelText(/security code/i), '1')
    await user.click(confirmButton)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(
      /correct your guest and mock payment details/i,
    )
  }, 10_000)

  test('Payment is valid', async () => {
    const user = userEvent.setup()
    const { router } = await renderCheckoutApp()
    await goToCheckout(user, 'both')
    await fillValidDetails(user)

    let resolveKing = (_value: string) => undefined
    fetchMock
      .mockResponseOnce(() => new Promise<string>((resolve) => {
        resolveKing = resolve
      }))
      .mockResponseOnce(JSON.stringify(bookingFor(
        queenCartItem,
        2,
        100002,
      )))

    await user.click(screen.getByRole('button', {
      name: /confirm booking/i,
    }))

    expect(await screen.findByRole('button', { name: /confirming/i }))
      .toBeDisabled()
    expect(screen.getByRole('button', {
      name: /remove premier king suite/i,
    })).toBeDisabled()

    act(() => {
      resolveKing(JSON.stringify(bookingFor(kingCartItem, 1, 100001)))
    })

    expect(await screen.findByRole('heading', { name: /booking confirmed/i }))
      .toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/confirmation')
    const confirmedRooms = screen.getByRole('list', {
      name: /confirmed rooms/i,
    })
    expect(within(confirmedRooms).getByText(kingSuite.name)).toBeInTheDocument()
    expect(within(confirmedRooms).getByText(queenSuite.name)).toBeInTheDocument()
    expect(within(confirmedRooms).getByText(/confirmation number: 100001/i))
      .toBeInTheDocument()
    expect(within(confirmedRooms).getByText(/confirmation number: 100002/i))
      .toBeInTheDocument()
    expect(within(confirmedRooms).getByText('2 guests')).toBeInTheDocument()
    expect(within(confirmedRooms).getByText('1 guest')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /confirmed booking total/i }))
      .toHaveTextContent('Total$500.00')
    expect(screen.getByText(/no payment was processed/i)).toBeInTheDocument()
    expect(screen.getByRole('button', {
      name: /shopping cart, 0 items/i,
    })).toBeInTheDocument()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const firstRequest = fetchMock.mock.calls[0]
    expect(firstRequest?.[1]?.body).toEqual(expect.any(String))
    const firstBody = JSON.parse(firstRequest?.[1]?.body as string) as object
    expect(firstRequest?.[0]).toBe('/bookings')
    expect(firstRequest?.[1]).toMatchObject({
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    expect(firstBody).toEqual({
      address: '1 Resort Way',
      from_date: kingCartItem.fromDate,
      guests: kingCartItem.guests,
      name: 'Eric Guest',
      room_type: kingSuite.room_type,
      to_date: kingCartItem.toDate,
    })
    expect(firstBody).not.toHaveProperty('cardNumber')

    await user.click(screen.getByRole('link', { name: /return home/i }))
    expect(router.state.location.pathname).toBe('/')
  }, 10_000)

  test('A 400 response prompts the user to resolve any issues', async () => {
    const user = userEvent.setup()
    const { router } = await renderCheckoutApp()
    await goToCheckout(user)
    await fillValidDetails(user)
    fetchMock.mockResponseOnce(
      JSON.stringify({ error: 'Invalid booking' }),
      { status: 400 },
    )

    await user.click(screen.getByRole('button', {
      name: /confirm booking/i,
    }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /review your details and try again/i,
    )
    expect(router.state.location.pathname).toBe('/checkout')
    expect(screen.getByText(kingSuite.name)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirm booking/i }))
      .toBeEnabled()
  })

  test('Expected request errors preserve the checkout for another attempt', async () => {
    const user = userEvent.setup()
    await renderCheckoutApp()
    await goToCheckout(user)
    await fillValidDetails(user)
    fetchMock.mockRejectOnce(new Error('offline'))

    await user.click(screen.getByRole('button', {
      name: /confirm booking/i,
    }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /could not confirm/i,
    )
    expect(screen.getByText(kingSuite.name)).toBeInTheDocument()
  })

  test.each([
    ['/checkout', 'Your checkout is empty', 'Find a room'],
    [
      '/confirmation',
      'No booking confirmation is available',
      'Find a room',
    ],
  ])(
    '%s has a safe empty state',
    async (initialEntry, heading, linkName) => {
      const user = userEvent.setup()
      const { router } = await renderCheckoutApp(initialEntry)

      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
      await user.click(screen.getByRole('link', { name: linkName }))

      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/')
      })
    },
  )
})
