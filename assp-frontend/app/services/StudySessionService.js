import User from "../class/User";

const BASE_URL = process.env.NEXT_PUBLIC_FLASK_SERVER_URL;

export async function fetchSessions(params = {}) {
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

  const url = `${process.env.NEXT_PUBLIC_FLASK_SERVER_URL}/studysessions?${queryParams.toString()}`;

  const res = await fetch(url);
  const data = await res.json();

  return data.data;
}

export async function createSession(session) {
  const user_data = User.getUserData();

  if (!user_data.login) {
    return Promise.reject(new Error("User not logged in"));
  }

  let user_id = user_data.data.user_id;

  await fetch(`${BASE_URL}/studysessions`, {
    method: "POST",
    // credentials: "include", // include cookies for session management
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...session, user_id }),
  });
}

export const deleteSession = async (id) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_FLASK_SERVER_URL}/studysessions/${id}`, {
    method: 'DELETE',
  });

  return res.json();
};

export const updateSession = async (id, data) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_FLASK_SERVER_URL}/studysessions/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
};

export const startSession = async (id) => {
  const res = await fetch(`${BASE_URL}/studysessions/${id}/start`, {
    method: "POST",
  });
  return res.json();
};

export const endSession = async (id, data = {}) => {
  const res = await fetch(`${BASE_URL}/studysessions/${id}/end`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
};