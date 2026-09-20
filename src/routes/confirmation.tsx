import { createFileRoute } from '@tanstack/react-router'
import { BookingConfirmationPage } from '../features/checkout/BookingConfirmationPage'

export const Route = createFileRoute('/confirmation')({
  component: ConfirmationRoutePage,
})

export function ConfirmationRoutePage() {
  return <BookingConfirmationPage />
}
