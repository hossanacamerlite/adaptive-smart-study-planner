class User {
	async checkAuth() {
		try {
			console.log("Checking auth status...", `${process.env.NEXT_PUBLIC_FLASK_SERVER_URL}/api/me`);
			const res = await fetch(`${process.env.NEXT_PUBLIC_FLASK_SERVER_URL}/api/me`, {
				credentials: 'include'
			});
			if (!res.ok) throw new Error('Not logged in');

			const data = await res.json();
			return { login: true, data: data }; // Return user data to your component state
		} catch (err) {
			console.error("Auth check failed:", err);
			return { login: false, data: null };
		}
	}

	login() {
		const flaskUrl = process.env.NEXT_PUBLIC_FLASK_SERVER_URL;
		console.log("Initiating login flow, redirecting to:", `${flaskUrl}/auth/google`);
		if (!flaskUrl) {
			console.error("Backend URL missing!");
			return;
		}
		// This stops all JS on the current page and moves the user to the login flow
		window.location.href = `${flaskUrl}/auth/google`;
	}

	isLogin() {
		return localStorage.getItem('user') ? true : false;
	}

	redirectToDashboard() {
		window.location.href = '/view/dashboard';
	}

	getUserData() {
		return this.isLogin() ? JSON.parse(localStorage.getItem('user')) : null;
	}

	clearUserData() {
		localStorage.removeItem('user');
	}

	async logout() {
		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_FLASK_SERVER_URL}/auth/logout`, {
				method: 'POST', // logout should usually be a POST to avoid accidental pre-fetching
				credentials: 'include'
			});

			if (!res.ok) {
				// Even if the server returns 401, we should treat the local session as cleared
				throw new Error('Logout request failed');
			}

			const data = await res.json();
			this.clearUserData(); // Clear local session data regardless of server response
			window.location.href = '/';
			// Return login: false because the user is now logged out
			return { login: false, data: null };

		} catch (err) {
			console.error("Logout failed:", err);
			this.clearUserData(); // Clear local session data on error as well
			window.location.href = '/';
			// On error, we still return login: false to force the UI to the logged-out state
			return { login: false, error: err.message };
		}
	}
}

const userInstance = new User();
export default userInstance;