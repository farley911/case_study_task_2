import { describe, expect, test } from '@jest/globals'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import Button from '@mui/material/Button'
import type { Stay } from '../../types/api'
import { AppLayout } from './AppLayout'
import { useBooking, type CartItemInput } from './BookingContext'

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

function CartHarness() {
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

async function renderCartApp() {
  const rootRoute = createRootRoute({
    component: () => (
      <AppLayout>
        <Outlet />
      </AppLayout>
    ),
  })
  const homeRoute = createRoute({
    component: CartHarness,
    getParentRoute: () => rootRoute,
    path: '/',
  })
  const checkoutRoute = createRoute({
    component: () => <h1>Checkout page</h1>,
    getParentRoute: () => rootRoute,
    path: '/checkout',
  })
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ['/'] }),
    routeTree: rootRoute.addChildren([homeRoute, checkoutRoute]),
  })
  await router.load()

  return {
    router,
    ...render(<RouterProvider router={router} />),
  }
}

async function openCart(user: ReturnType<typeof userEvent.setup>) {
  const cartButton = screen.getByRole('button', {
    name: /shopping cart, \d+ items/i,
  })
  await user.click(cartButton)
  const cart = await screen.findByRole('dialog', { name: /shopping cart/i })

  return { cart, cartButton }
}

describe('Shopping cart', () => {
  test('Cart is expanded', async () => {
    const user = userEvent.setup()
    await renderCartApp()

    const { cart, cartButton } = await openCart(user)

    expect(cart).toBeVisible()
    expect(cartButton).toHaveAttribute('aria-expanded', 'true')
  })

  test('Cart is collapsed', async () => {
    const user = userEvent.setup()
    await renderCartApp()
    const { cart, cartButton } = await openCart(user)

    await user.click(within(cart).getByRole('button', { name: /close cart/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /shopping cart/i }))
        .not.toBeInTheDocument()
    })
    expect(cartButton).toHaveAttribute('aria-expanded', 'false')
  })

  test('Stay is removed', async () => {
    const user = userEvent.setup()
    await renderCartApp()
    await user.click(screen.getByRole('button', { name: /add king suite/i }))
    await user.click(screen.getByRole('button', { name: /add queen suite/i }))
    const { cart, cartButton } = await openCart(user)

    await user.click(within(cart).getByRole('button', {
      name: /remove premier king suite/i,
    }))

    expect(within(cart).queryByText(kingSuite.name)).not.toBeInTheDocument()
    expect(within(cart).getByText(queenSuite.name)).toBeInTheDocument()
    expect(cartButton).toHaveAccessibleName('Shopping cart, 1 items')
  })

  test('All stays and prices are itemized without trip enhancements', async () => {
    const user = userEvent.setup()
    await renderCartApp()
    await user.click(screen.getByRole('button', { name: /add king suite/i }))
    await user.click(screen.getByRole('button', { name: /add queen suite/i }))
    const { cart } = await openCart(user)

    const roomList = within(cart).getByRole('list', { name: /rooms in cart/i })
    expect(within(roomList).getAllByRole('listitem')).toHaveLength(2)
    expect(within(cart).getByText('Sep 4, 2026 – Sep 7, 2026'))
      .toBeInTheDocument()
    expect(within(cart).getByText('2 guests')).toBeInTheDocument()
    expect(within(cart).getByText('Oct 10, 2026 – Oct 11, 2026'))
      .toBeInTheDocument()
    expect(within(cart).getByText('1 guest')).toBeInTheDocument()

    const kingPrice = within(cart).getByRole('group', {
      name: /premier king suite price breakdown/i,
    })
    expect(within(kingPrice).getByText('$100.00')).toBeInTheDocument()
    expect(within(kingPrice).getByText('3 nights')).toBeInTheDocument()
    expect(within(kingPrice).getByText('$300.00')).toBeInTheDocument()

    const queenPrice = within(cart).getByRole('group', {
      name: /premier queen suite price breakdown/i,
    })
    expect(within(queenPrice).getAllByText('$200.00')).toHaveLength(2)
    expect(within(queenPrice).getByText('1 night')).toBeInTheDocument()

    const subtotal = within(cart).getByRole('group', { name: /cart subtotal/i })
    expect(within(subtotal).getByText('$500.00')).toBeInTheDocument()
    expect(within(cart).getByText('*Excluding taxes')).toBeInTheDocument()
    expect(within(cart).queryByText(/trip enhancements/i))
      .not.toBeInTheDocument()
  })

  test('Clear all removes every stay from the cart', async () => {
    const user = userEvent.setup()
    await renderCartApp()
    await user.click(screen.getByRole('button', { name: /add king suite/i }))
    await user.click(screen.getByRole('button', { name: /add queen suite/i }))
    const { cart, cartButton } = await openCart(user)

    await user.click(within(cart).getByRole('button', { name: /clear all/i }))

    expect(within(cart).getByText('Your cart is empty.')).toBeInTheDocument()
    expect(within(cart).queryByRole('list', { name: /rooms in cart/i }))
      .not.toBeInTheDocument()
    expect(cartButton).toHaveAccessibleName('Shopping cart, 0 items')
    expect(within(cart).getByRole('button', { name: /clear all/i }))
      .toBeDisabled()
  })

  test('Clicking Checkout routes the user to checkout', async () => {
    const user = userEvent.setup()
    const { router } = await renderCartApp()
    await user.click(screen.getByRole('button', { name: /add king suite/i }))
    const { cart } = await openCart(user)

    await user.click(within(cart).getByRole('button', { name: /checkout/i }))

    expect(router.state.location.pathname).toBe('/checkout')
    expect(await screen.findByRole('heading', { name: /checkout page/i }))
      .toBeInTheDocument()
  })
})
