@app.route("/auth/google/callback", methods=["GET"])
def google_auth_callback():
    # Handle Google OAuth callback logic here
    return {"message": "Google OAuth callback received"}
