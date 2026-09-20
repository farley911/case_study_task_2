import CloseIcon from '@mui/icons-material/Close'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { useNavigate } from '@tanstack/react-router'
import { useBooking, type CartItem } from './BookingContext'

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

function numberOfNights(item: CartItem) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000
  return (
    Date.parse(`${item.toDate}T00:00:00Z`)
    - Date.parse(`${item.fromDate}T00:00:00Z`)
  ) / millisecondsPerDay
}

function formatDate(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`))
}

function CartRoom({ item }: { item: CartItem }) {
  const { removeFromCart } = useBooking()
  const nights = numberOfNights(item)

  return (
    <Box
      component="li"
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        listStyle: 'none',
        px: 2,
        py: 2.5,
      }}
    >
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Box
          component="img"
          src={item.stay.photos[0]}
          alt={`${item.stay.name} room`}
          sx={{
            borderRadius: 1,
            height: 88,
            objectFit: 'cover',
            width: 112,
          }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 700 }}>
            {item.stay.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDate(item.fromDate)} – {formatDate(item.toDate)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {item.guests} {item.guests === 1 ? 'guest' : 'guests'}
          </Typography>
          <Button
            type="button"
            aria-label={`Remove ${item.stay.name}`}
            onClick={() => {
              removeFromCart(item.id)
            }}
            sx={{ minWidth: 0, mt: 0.5, p: 0, textDecoration: 'underline' }}
          >
            Remove
          </Button>
        </Box>
      </Box>

      <Box
        role="group"
        aria-label={`${item.stay.name} price breakdown`}
        sx={{ mt: 2 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2">Nightly rate</Typography>
          <Typography variant="body2">
            {currencyFormatter.format(item.stay.price)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          <Typography variant="body2">
            {nights} {nights === 1 ? 'night' : 'nights'}
          </Typography>
          <Typography variant="body2">
            × {currencyFormatter.format(item.stay.price)}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            fontWeight: 700,
            justifyContent: 'space-between',
            mt: 1,
          }}
        >
          <Typography sx={{ fontWeight: 'inherit' }}>Room subtotal</Typography>
          <Typography sx={{ fontWeight: 'inherit' }}>
            {currencyFormatter.format(item.totalPrice)}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export function ShoppingCartPane({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { cartItems, clearCart } = useBooking()
  const navigate = useNavigate()
  const subtotal = cartItems.reduce(
    (total, item) => total + item.totalPrice,
    0,
  )

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box
        role="dialog"
        aria-modal="true"
        aria-labelledby="shopping-cart-heading"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: { xs: '100vw', sm: 440 },
        }}
      >
        <Box sx={{ alignItems: 'center', display: 'flex', px: 2, py: 1.5 }}>
          <Typography
            id="shopping-cart-heading"
            component="h2"
            variant="h5"
            sx={{ flexGrow: 1 }}
          >
            Shopping Cart
          </Typography>
          <IconButton type="button" aria-label="Close cart" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />

        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
          }}
        >
          <Typography>
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
          </Typography>
          <Button
            type="button"
            disabled={cartItems.length === 0}
            onClick={clearCart}
            sx={{ textDecoration: 'underline' }}
          >
            Clear All
          </Button>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {cartItems.length === 0
            ? (
                <Typography
                  color="text.secondary"
                  sx={{ px: 2, py: 6, textAlign: 'center' }}
                >
                  Your cart is empty.
                </Typography>
              )
            : (
                <Box
                  component="ul"
                  aria-label="Rooms in cart"
                  sx={{ m: 0, p: 0 }}
                >
                  {cartItems.map((item) => (
                    <CartRoom item={item} key={item.id} />
                  ))}
                </Box>
              )}
        </Box>

        <Box
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            boxShadow: 3,
            px: 2,
            py: 2,
          }}
        >
          <Box
            role="group"
            aria-label="Cart subtotal"
            sx={{ display: 'flex', justifyContent: 'space-between' }}
          >
            <Typography sx={{ fontWeight: 700 }}>Subtotal</Typography>
            <Typography sx={{ fontWeight: 700 }}>
              {currencyFormatter.format(subtotal)}
            </Typography>
          </Box>
          <Typography variant="caption">*Excluding taxes</Typography>
          <Button
            type="button"
            variant="contained"
            disabled={cartItems.length === 0}
            fullWidth
            onClick={() => {
              onClose()
              void navigate({ to: '/checkout' })
            }}
            sx={{ mt: 2, py: 1.25 }}
          >
            Checkout
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}
