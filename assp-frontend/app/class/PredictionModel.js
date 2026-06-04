class PredictionModel {

	async predictData(filter = {}, sort = {}) {
		try {
			const query = new URLSearchParams(filter).toString();
			const response = await fetch(process.env.NEXT_PUBLIC_FLASK_SERVER_URL + "predict?" + query);
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

export default PredictionModel;