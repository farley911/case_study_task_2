import { createLazyFileRoute } from '@tanstack/react-router'
import { CheckoutPage } from '../features/checkout/CheckoutPage'

export const Route = createLazyFileRoute('/checkout')({
  component: CheckoutPage,
})
