import { beforeEach, describe, expect, test } from '@jest/globals'
import fetchMock from 'jest-fetch-mock'
import type { Review, Stay } from '../../types/api'
import {
  fetchStay,
  fetchStayReviews,
  postStayReview,
  stayQueryKey,
  stayReviewsQueryKey,
} from './stayDetailsQuery'

const stay: Stay = {
  description: 'A spacious suite with a king bed and a panoramic resort view.',
  id: 1,
  name: 'Premier King Suite',
  photos: ['https://example.com/one.jpg'],
  price: 100,
  room_type: 'king_suite',
}

const reviews: Review[] = [{
  id: 1,
  rating: 3,
  review: 'Comfortable and quiet.',
  room_type: 'king_suite',
}]

beforeEach(() => {
  fetchMock.resetMocks()
})

describe('Stay details API', () => {
  test('Stay and review query keys identify a room', () => {
    expect(stayQueryKey('king_suite')).toEqual(['stays', 'king_suite'])
    expect(stayReviewsQueryKey('king_suite')).toEqual(
      ['stays', 'king_suite', 'reviews'],
    )
  })

  test('User requests details for a stay', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(stay))

    await expect(fetchStay('king_suite')).resolves.toEqual(stay)
    expect(fetchMock).toHaveBeenCalledWith(
      '/stays/king_suite',
      expect.objectContaining({ signal: undefined }),
    )
  })

  test('User requests details for an unknown stay', async () => {
    fetchMock.mockResponseOnce('', { status: 404 })

    await expect(fetchStay('not-a-room')).rejects.toThrow(
      'Unable to load this room.',
    )
  })

  test('A non-Error rejection uses the standard loading failure message', async () => {
    fetchMock.mockRejectOnce('failed')

    await expect(fetchStay('king_suite')).rejects.toThrow(
      'Unable to load this room.',
    )
  })

  test('User requests reviews for a stay', async () => {
    const abort = new AbortController()
    fetchMock.mockResponseOnce(JSON.stringify(reviews))

    await expect(fetchStayReviews('king_suite', abort.signal))
      .resolves.toEqual(reviews)
    expect(fetchMock).toHaveBeenCalledWith(
      '/stays/king_suite/reviews',
      expect.objectContaining({ signal: abort.signal }),
    )
  })

  test('User submits a review', async () => {
    const created: Review = {
      id: 2,
      rating: 4,
      review: 'A wonderful stay.',
      room_type: 'king_suite',
    }
    fetchMock.mockResponseOnce(JSON.stringify(created))

    await expect(postStayReview('king_suite', {
      rating: 4,
      review: 'A wonderful stay.',
    })).resolves.toEqual(created)
    expect(fetchMock).toHaveBeenCalledWith(
      '/stays/king_suite/reviews',
      expect.objectContaining({
        body: JSON.stringify({ rating: 4, review: 'A wonderful stay.' }),
        method: 'POST',
      }),
    )
  })

  test('User submits an invalid review', async () => {
    fetchMock.mockResponseOnce('', { status: 400 })

    await expect(postStayReview('king_suite', {
      rating: 6,
      review: '',
    })).rejects.toThrow('Unable to submit your review.')
  })
})
