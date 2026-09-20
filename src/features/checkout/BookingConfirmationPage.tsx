import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { Link } from '@tanstack/react-router'
import { useBooking } from '../global/BookingContext'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  style: 'currency',
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatDate(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`))
}

export function BookingConfirmationPage() {
  const { confirmation } = useBooking()

  if (confirmation === null) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 4, sm: 6 } }}>
        <Typography component="h1" variant="h4">
          No booking confirmation is available
        </Typography>
        <Typography sx={{ mt: 2 }}>
          Complete checkout to view your booking confirmation.
        </Typography>
        <Button component={Link} to="/" variant="contained" sx={{ mt: 3 }}>
          Find a room
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, sm: 6 } }}>
      <Typography component="h1" variant="h4">
        Booking confirmed
      </Typography>
      <Typography sx={{ mt: 1 }}>
        Your reservation is confirmed.
      </Typography>
      <Typography sx={{ mt: 1 }}>
        No payment was processed.
      </Typography>

      <Box
        component="ul"
        aria-label="Confirmed rooms"
        sx={{ display: 'grid', gap: 2, m: 0, mt: 3, p: 0 }}
      >
        {confirmation.bookings.map((booking, index) => {
          const item = confirmation.items[index]

          return (
            <Paper
              component="li"
              key={booking.id}
              variant="outlined"
              sx={{ listStyle: 'none', p: 3 }}
            >
              <Typography component="h2" variant="h6">
                {item.stay.name}
              </Typography>
              <Typography>
                {formatDate(booking.from_date)} – {formatDate(booking.to_date)}
              </Typography>
              <Typography>
                {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}
              </Typography>
              <Typography>Guest: {booking.name}</Typography>
              <Typography>Address: {booking.address}</Typography>
              <Typography sx={{ mt: 1 }}>
                Room subtotal: {currencyFormatter.format(item.totalPrice)}
              </Typography>
              <Typography sx={{ fontWeight: 700, mt: 1 }}>
                Confirmation number: {booking.confirmationNumber}
              </Typography>
            </Paper>
          )
        })}
      </Box>

      <Paper
        role="group"
        aria-label="Confirmed booking total"
        variant="outlined"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mt: 3,
          p: 3,
        }}
      >
        <Typography sx={{ fontWeight: 700 }}>Total</Typography>
        <Typography sx={{ fontWeight: 700 }}>
          {currencyFormatter.format(confirmation.total)}
        </Typography>
      </Paper>
      <Button component={Link} to="/" variant="contained" sx={{ mt: 3 }}>
        Return home
      </Button>
    </Container>
  )
}
