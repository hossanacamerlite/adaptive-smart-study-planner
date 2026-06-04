import User from "../class/User";

const BASE_URL = process.env.NEXT_PUBLIC_FLASK_SERVER_URL;

export async function fetchNotes(params = {}) {

	// Merge user_id with other params
	const queryParams = new URLSearchParams({
		...params
	});

	const url = `${process.env.NEXT_PUBLIC_FLASK_SERVER_URL}/studynotes?${queryParams.toString()}`;

	const res = await fetch(url);
	const data = await res.json();

	return data.data;
}

export async function saveStudyNote(note) {
	try {
		const response = await fetch(`${BASE_URL}/studynotes`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ ...note }),
		});

		// This converts the readable stream from the server into a JS object
		const data = await response.json();

		// Return the data so your 'handleSave' function can use it
		return data;
	} catch (error) {
		console.error("Error in saveStudyNote service:", error);
		return { success: false, error: "Network error" };
	}
}