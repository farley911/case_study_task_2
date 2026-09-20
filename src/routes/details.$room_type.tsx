import Container from '@mui/material/Container'
import { createFileRoute } from '@tanstack/react-router'
import { StayDetails } from '../features/room/StayDetails'

export const Route = createFileRoute('/details/$room_type')({
  component: RoomDetailsPage,
})

export function RoomDetailsPage() {
  const { room_type: roomType } = Route.useParams()

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 6 } }}>
      <StayDetails roomType={roomType} />
    </Container>
  )
}
