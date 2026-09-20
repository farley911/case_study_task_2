import Container from '@mui/material/Container'
import { createFileRoute } from '@tanstack/react-router'
import { StayList } from '../features/room/StayList'

export const Route = createFileRoute('/')({
  component: HomePage,
})

export function HomePage() {
  return (
    <Container
      maxWidth="lg"
      sx={{
        py: { xs: 6, sm: 10 },
      }}
    >
      <StayList />
    </Container>
  )
}
