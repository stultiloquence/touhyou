import { timingSafeEqual } from 'crypto'

export const isOwner = (pollID, voterID) => {
	// Prevent timing attacks on the owner id.
	return timingSafeEqual(Buffer.from(data[pollID].owner, 'utf8'), Buffer.from(voterID, 'utf8'))
}

const data = {
	"poll1": {
		"options": [ "Hunter x Hunter", "Dragon Ball", "YuGiOh" ],
		"owner": "voterID1",
		"votes": {
			"voterID1": "Dragon Ball",
			"voterID2": "Dragon Ball",
			"voterID3": "YuGiOh",
			"voterID4": "Dragon Ball",
		},
		"open": true,
	},
	"poll2": {
		"options": [ "Hunter x Hunter", "Dragon Ball", "YuGiOh" ],
		"owner": "voterID2",
		"votes": {
			"voterID1": "Dragon Ball",
			"voterID2": "Dragon Ball",
			"voterID3": "YuGiOh",
			"voterID4": "Dragon Ball",
		},
		"open": true,
	} 
}

export default data