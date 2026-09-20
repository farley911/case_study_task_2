import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const stays = JSON.parse(
  readFileSync(new URL('./mocks/stays.json', import.meta.url), 'utf8'),
)
const reviewMocks = JSON.parse(
  readFileSync(new URL('./mocks/reviews.json', import.meta.url), 'utf8'),
)

const roomTypes = new Set(stays.map((stay) => stay.room_type))
const submittedReviews = []
const bookings = []

const responseHeaders = {
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json; charset=utf-8',
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, responseHeaders)
  response.end(JSON.stringify(body))
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value)
}

function isPositiveInteger(value) {
  const number = Number(value)
  return Number.isInteger(number) && number >= 1
}

function hasValidStaySearch(searchParams) {
  return (
    isValidDate(searchParams.get('from_date'))
    && isValidDate(searchParams.get('to_date'))
    && isPositiveInteger(searchParams.get('guests'))
  )
}

function isValidReview(value) {
  return (
    isObject(value)
    && isNonEmptyString(value.review)
    && Number.isInteger(value.rating)
    && value.rating >= 1
    && value.rating <= 5
  )
}

function isValidBooking(value) {
  return (
    isObject(value)
    && roomTypes.has(value.room_type)
    && isValidDate(value.from_date)
    && isValidDate(value.to_date)
    && isPositiveInteger(value.guests)
    && isNonEmptyString(value.name)
    && isNonEmptyString(value.address)
  )
}

async function readJsonBody(request) {
  const chunks = []

  for await (const chunk of request) {
    chunks.push(chunk)
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

async function handleRequest(request, response) {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, responseHeaders)
    response.end()
    return
  }

  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)

  if (request.method === 'GET' && (url.pathname === '/stays' || url.pathname === '/stays/')) {
    if (!hasValidStaySearch(url.searchParams)) {
      sendJson(response, 400, { error: 'Invalid stay parameters' })
      return
    }

    sendJson(response, 200, stays)
    return
  }

  const reviewsMatch = /^\/stays\/([^/]+)\/reviews\/?$/.exec(url.pathname)
  if (reviewsMatch) {
    let roomType

    try {
      roomType = decodeURIComponent(reviewsMatch[1])
    } catch {
      sendJson(response, 400, { error: 'Invalid room type' })
      return
    }

    if (!roomTypes.has(roomType)) {
      sendJson(response, 400, { error: 'Invalid room type' })
      return
    }

    if (request.method === 'GET') {
      const reviews = [...reviewMocks, ...submittedReviews]
        .filter((review) => review.room_type === roomType)
      sendJson(response, 200, reviews)
      return
    }

    if (request.method === 'POST') {
      try {
        const body = await readJsonBody(request)

        if (!isValidReview(body)) {
          sendJson(response, 400, { error: 'Invalid review' })
          return
        }

        const review = {
          id: reviewMocks.length + submittedReviews.length + 1,
          room_type: roomType,
          review: body.review.trim(),
          rating: body.rating,
        }
        submittedReviews.push(review)
        sendJson(response, 200, review)
      } catch {
        sendJson(response, 400, { error: 'Invalid review' })
      }
      return
    }
  }

  const stayMatch = /^\/stays\/([^/]+)\/?$/.exec(url.pathname)
  if (request.method === 'GET' && stayMatch) {
    let roomType

    try {
      roomType = decodeURIComponent(stayMatch[1])
    } catch {
      sendJson(response, 400, { error: 'Invalid room type' })
      return
    }

    const stay = stays.find((candidate) => candidate.room_type === roomType)

    if (!stay) {
      sendJson(response, 404, { error: 'Stay not found' })
      return
    }

    sendJson(response, 200, stay)
    return
  }

  if (request.method === 'POST' && (url.pathname === '/bookings' || url.pathname === '/bookings/')) {
    try {
      const body = await readJsonBody(request)

      if (!isValidBooking(body)) {
        sendJson(response, 400, { error: 'Invalid booking' })
        return
      }

      const id = bookings.length + 1
      const booking = {
        id,
        room_type: body.room_type,
        from_date: body.from_date,
        to_date: body.to_date,
        guests: Number(body.guests),
        name: body.name.trim(),
        address: body.address.trim(),
        confirmationNumber: 100000 + id,
      }
      bookings.push(booking)
      sendJson(response, 200, booking)
    } catch {
      sendJson(response, 400, { error: 'Invalid booking' })
    }
    return
  }

  sendJson(response, 404, { error: 'Not found' })
}

export function createApiServer() {
  return createServer((request, response) => {
    handleRequest(request, response).catch(() => {
      sendJson(response, 500, { error: 'Server error' })
    })
  })
}

export function startApiServer(port = Number(process.env.PORT ?? 3001)) {
  const server = createApiServer()
  server.listen(port, '127.0.0.1', () => {
    const address = server.address()
    const activePort = typeof address === 'object' && address !== null
      ? address.port
      : port
    console.log(`API listening on http://127.0.0.1:${activePort}`)
  })
  return server
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startApiServer()
}
