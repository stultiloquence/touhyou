import express from 'express'
import cookie from 'cookie'
import WebSocket, { WebSocketServer } from 'ws'
import { createServer } from 'http'

import { URL, fileURLToPath } from 'url'
import { resolve } from 'path'
const __dirname = fileURLToPath(new URL('.', import.meta.url));

import database, { isOwner } from './database.js'

import { countBy, pull } from 'lodash-es'

const app = express()

app.use(express.static(resolve(__dirname, 'static')))

app.get('/poll/:pollID', (req, res) => {
	if (database[req.params.pollID]) {
		res.sendFile(resolve(__dirname, 'poll.html'), {}, (err) => console.error(err))
	} else {
		res.sendStatus(404)
	}
})

const server = createServer(app)

const connections = {
	poll1: {},
	poll2: {},
}

const broadcast = (pollID, message) => {
	for (const voterID in connections[pollID]) {
		const voter = connections[pollID][voterID]
		for (const ws of voter) {
			ws.send(message)
		}
	}
}

const resultsMessage = (poll) => JSON.stringify({
	method: 'results',
	results: countBy(Object.values(poll.votes)),
})

const wss = new WebSocketServer({ noServer: true })
server.on('upgrade', (request, socket, head) => {
	const matches = /^\/poll\/([a-zA-Z0-9-]+)\/?$/.exec(request.url)
	if (!matches) {
		socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
		socket.end()
		return
	}
	const pollID = matches[1]
	if (!database[pollID]) {
		socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
		socket.end()
		return
	}
	const voterID = cookie.parse(request.headers.cookie || '').voterID
	if (voterID === undefined) {
		socket.write('HTTP/1.1 400 Bad Request\r\n\r\n')
		socket.end()
		return
	}

	wss.handleUpgrade(request, socket, head, (ws) => {
		wss.emit('connection', ws, request, { pollID, voterID })
	})
})

wss.on('connection', (ws, req, { pollID, voterID }) => {
	if (!connections[pollID][voterID]) {
		connections[pollID][voterID] = []
	}
	connections[pollID][voterID].push(ws)
	ws.on('close', () => {
		pull(connections[pollID][voterID], ws)
	})

	const poll = database[pollID]
	if (poll.open) {
		ws.send(JSON.stringify({
			method: 'options',
			options: database[pollID].options
		}))
	} else {
		ws.send(resultsMessage(poll))
	}

	ws.on('message', (message) => {
		console.log('websocket message from', voterID, 'for poll', pollID, '=', message)
		let request
		try {
			request = JSON.parse(message.toString())
		} catch (err) {
			if (err instanceof SyntaxError) {
				console.log('Invalid client message', message)
				ws.close()
				return;
			} else {
				throw err
			}
		}

		switch (request.method) {
		case 'vote':
			if (!poll.open) {
				return
			}
			if (!poll.options.includes(request.vote)) {
				console.log(request.vote, 'does not exist in poll', poll)
				ws.close()
				return
			}
			poll.votes[voterID] = request.vote
			broadcast(pollID, JSON.stringify({
				method: 'vote count',
				count: Object.keys(poll.votes).length,
			}))
			break
		case 'close poll':
			if (!poll.open) {
				return
			}
			if (!isOwner(pollID, voterID)) {
				console.log(request.owner, 'is not the owner of', poll)
				ws.close()
				return
			}
			poll.open = false
			broadcast(pollID, resultsMessage(poll))
			break
		default:
			console.log('Got an unknown message from a client:', request)
		}

	})
})

server.listen(3000, (err) => {
	if (err) {
		console.error(err)
	} else {
		console.log('Listening on port 3000.')
	}
})