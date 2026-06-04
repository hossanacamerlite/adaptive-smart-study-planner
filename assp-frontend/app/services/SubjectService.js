import User from "../class/User";

const BASE_URL = process.env.NEXT_PUBLIC_FLASK_SERVER_URL;

export async function fetchSubjects(params = {}) {
	const user_data = User.getUserData();

	if (!user_data.login) {
		return Promise.reject(new Error("User not logged in"));
	}

	const user_id = user_data.data.user_id;

	// Merge user_id with other params
	const queryParams = new URLSearchParams({
		user_id,
		...params
	});

	const url = `${process.env.NEXT_PUBLIC_FLASK_SERVER_URL}/subjects?${queryParams.toString()}`;

	const res = await fetch(url);
	const data = await res.json();

	return data.data;
}

export async function saveSubject(subject) {
	const user_data = User.getUserData();

	if (!user_data.login) {
		return Promise.reject(new Error("User not logged in"));
	}

	let user_id = user_data.data.user_id;

	try {
		const response = await fetch(`${BASE_URL}/subjects`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ ...subject, user_id }),
		});

		// This converts the readable stream from the server into a JS object
		const data = await response.json();

		// Return the data so your 'handleSave' function can use it
		return data;
	} catch (error) {
		console.error("Error in subjects service:", error);
		return { success: false, error: "Network error" };
	}
}

export const deleteSubject = async (id) => {
	const res = await fetch(`${process.env.NEXT_PUBLIC_FLASK_SERVER_URL}/subjects/${id}`, {
	  method: 'DELETE',
	});
  
	return res.json();
  };