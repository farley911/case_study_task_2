/// <reference types="node" />

import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test,
} from '@jest/globals'
import fetchMock from 'jest-fetch-mock'
import type { AddRoomReview, CreateBooking } from '../../types/api'

let apiProcess: ChildProcessWithoutNullStreams
let apiUrl = ''

async function requestJson(
  path: string,
  init?: RequestInit,
): Promise<{ body: unknown, response: Response }> {
  const response = await fetch(`${apiUrl}${path}`, init)
  const body: unknown = await response.json()
  return { body, response }
}

beforeAll(async () => {
  fetchMock.dontMock()
  apiProcess = spawn(process.execPath, ['api/server.mjs'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: '0',
    },
  })

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('The API did not start within 10 seconds'))
    }, 10_000)

    apiProcess.once('error', reject)
    apiProcess.stderr.once('data', (chunk: Buffer) => {
      clearTimeout(timeout)
      reject(new Error(chunk.toString()))
    })
    apiProcess.stdout.once('data', (chunk: Buffer) => {
      const match = /API listening on (http:\/\/127\.0\.0\.1:\d+)/.exec(chunk.toString())

      if (!match) {
        clearTimeout(timeout)
        reject(new Error(`Unexpected API startup output: ${chunk.toString()}`))
        return
      }

      clearTimeout(timeout)
      apiUrl = match[1]
      resolve()
    })
  })
}, 15_000)

afterAll(async () => {
  fetchMock.doMock()

  await new Promise<void>((resolve) => {
    apiProcess.once('exit', () => {
      resolve()
    })
    apiProcess.kill()
  })
})

describe('Booking API', () => {
  test('API is available', async () => {
    const response = await fetch(`${apiUrl}/stays`, { method: 'OPTIONS' })

    expect(response.status).toBe(204)
    expect(response.headers.get('access-control-allow-origin')).toBe('*')
  })

  test.each(['/stays', '/stays/'])(
    'User searches for stays at %s',
    async (path) => {
      const firstSearch = await requestJson(
        `${path}?from_date=2026-09-01&to_date=2026-09-02&guests=2`,
      )
      const secondSearch = await requestJson(
        `${path}?from_date=2027-01-10&to_date=2027-01-20&guests=4`,
      )

      expect(firstSearch.response.status).toBe(200)
      expect(firstSearch.body).toEqual(secondSearch.body)
      expect(firstSearch.body).toEqual([
        expect.objectContaining({
          id: 1,
          name: 'Premier King Suite',
          room_type: 'king_suite',
        }),
        expect.objectContaining({ id: 2, room_type: 'strip_view_king_suite' }),
        expect.objectContaining({ id: 3, room_type: 'queen_suite' }),
        expect.objectContaining({ id: 4, room_type: 'strip_view_queen_suite' }),
      ])
    },
  )

  test('User submits an invalid search for stays', async () => {
    const { body, response } = await requestJson(
      '/stays?from_date=not-a-date&to_date=2026-09-02&guests=0',
    )

    expect(response.status).toBe(400)
    expect(body).toEqual({ error: 'Invalid stay parameters' })
  })

  test('User requests the details for a room type', async () => {
    const { body, response } = await requestJson('/stays/king_suite')

    expect(response.status).toBe(200)
    expect(body).toEqual(expect.objectContaining({
      id: 1,
      name: 'Premier King Suite',
      room_type: 'king_suite',
    }))
  })

  test('User requests details for an unknown room type', async () => {
    const { body, response } = await requestJson('/stays/not-a-room')

    expect(response.status).toBe(404)
    expect(body).toEqual({ error: 'Stay not found' })
  })

  test('User requests reviews for a stay with reviews', async () => {
    const { body, response } = await requestJson('/stays/king_suite/reviews')

    expect(response.status).toBe(200)
    expect(body).toEqual([
      expect.objectContaining({
        id: 1,
        rating: 5,
        room_type: 'king_suite',
      }),
    ])
  })

  test('User submits an invalid request for stay reviews', async () => {
    const { body, response } = await requestJson('/stays/not-a-room/reviews')

    expect(response.status).toBe(400)
    expect(body).toEqual({ error: 'Invalid room type' })
  })

  test('User requests reviews for a stay without reviews', async () => {
    const { body, response } = await requestJson(
      '/stays/strip_view_queen_suite/reviews',
    )

    expect(response.status).toBe(200)
    expect(body).toEqual([])
  })

  test('User submits a review', async () => {
    const review: AddRoomReview = {
      rating: 4,
      review: '  A spacious and comfortable room.  ',
    }
    const { body, response } = await requestJson('/stays/king_suite/reviews', {
      body: JSON.stringify(review),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })

    expect(response.status).toBe(200)
    expect(body).toEqual({
      id: 4,
      rating: 4,
      review: 'A spacious and comfortable room.',
      room_type: 'king_suite',
    })

    const storedReviews = await requestJson('/stays/king_suite/reviews')
    expect(storedReviews.body).toContainEqual(body)
  })

  test('User submits an invalid request to add a review', async () => {
    const { body, response } = await requestJson('/stays/king_suite/reviews', {
      body: JSON.stringify({ rating: 6, review: '' }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })

    expect(response.status).toBe(400)
    expect(body).toEqual({ error: 'Invalid review' })
  })

  test('User submits a booking request', async () => {
    const request: CreateBooking = {
      address: '123 Main Street',
      from_date: '2026-09-01',
      guests: 2,
      name: '  Eric Guest  ',
      room_type: 'king_suite',
      to_date: '2026-09-03',
    }
    const { body, response } = await requestJson('/bookings', {
      body: JSON.stringify(request),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })

    expect(response.status).toBe(200)
    expect(body).toEqual({
      ...request,
      confirmationNumber: 100001,
      id: 1,
      name: 'Eric Guest',
    })
  })

  test('User submits an invalid booking request', async () => {
    const { body, response } = await requestJson('/bookings', {
      body: JSON.stringify({
        from_date: '2026-09-01',
        guests: 0,
        room_type: 'unknown',
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })

    expect(response.status).toBe(400)
    expect(body).toEqual({ error: 'Invalid booking' })
  })
})
