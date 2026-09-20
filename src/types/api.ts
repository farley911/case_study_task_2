export interface Stay {
  id: number
  room_type: string
  name: string
  description: string
  photos: string[]
  price: number
}

export interface Review {
  id: number
  room_type: string
  review: string
  rating: number
}

export type AddRoomReview = Pick<Review, 'review' | 'rating'>

export interface CreateBooking {
  room_type: string
  from_date: string
  to_date: string
  guests: number
  name: string
  address: string
}

export interface Booking extends CreateBooking {
  id: number
  confirmationNumber: number
}
