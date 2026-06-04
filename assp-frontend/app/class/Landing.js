class Landing {
	async fetchTestData(filter = {}, sort = {}) {
		try {
			const response = await fetch(process.env.NEXT_PUBLIC_FLASK_SERVER_URL);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const data = await response.json();
			return data;
		} catch (error) {
			console.error("Fetch error:", error);
			return null;
		}
	}

	async fetchStudySessions(filter = {}, sort = {}) {
		try {
			const query = new URLSearchParams(filter).toString();
			const response = await fetch(process.env.NEXT_PUBLIC_FLASK_SERVER_URL + "studysessions?" + query);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const data = await response.json();
			return data;
		} catch (error) {
			console.error("Fetch error:", error);
			return null;
		}
	}
}

export default Landing;