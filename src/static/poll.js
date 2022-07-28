if (!document.cookie.split('; ').find((row) => row.startsWith('voterID='))) {
	document.cookie = `voterID=${window.crypto.randomUUID()}; SameSite=None; Secure`
}
const socket = new WebSocket('ws://localhost:3000' + window.location.pathname)

socket.addEventListener('message', (event) => {
	const response = JSON.parse(event.data)
	switch (response.method) {
	case 'options':
		displayOptions(response.options)
		break
	case 'vote count':
		displayVoteCount(response.count)
		break
	case 'results':
		displayResults(response.results)
		break
	default:
		console.error('Got an unknown message from the server:', response)
	}
})

const createOption = (name) => {
	const input = document.createElement('input')
	input.setAttribute('type', 'radio')
	input.setAttribute('id', name)
	input.setAttribute('value', name)
	input.setAttribute('name', 'movie')

	const label = document.createElement('label')
	label.setAttribute('for', name)
	label.innerHTML = name

	const div = document.createElement('div')
	div.appendChild(input)
	div.appendChild(label)

	return div
}

const displayOptions = (options) => {
	const fragment = document.createDocumentFragment()
	for (const option of options) {
		fragment.appendChild(createOption(option))
	}
	if (options.length > 0) {
		fragment.firstChild.checked = true
	}
	document.getElementById('movie').appendChild(fragment)
	document.getElementById('form').style.display = 'block'
}

const hideOptions = (options) => {
	document.getElementById('form').style.display = 'none'
}

document.getElementById("submit").addEventListener('click', (event) => {
	event.preventDefault()
	const radioButtons = document.querySelectorAll('input[name="movie"]')
	let selection
	for (const radioButton of radioButtons) {
		if (radioButton.checked) {
			selection = radioButton.value
			break
		}
	}
	socket.send(JSON.stringify({
		method: 'vote',
		vote: selection,
	}))
})

const displayResults = (results) => {
	hideOptions()
	// todo
}

const displayVoteCount = (count) => {
	console.log("count todo")
}