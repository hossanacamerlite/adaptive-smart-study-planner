"use client";

import { usePathname } from "next/navigation";
import User from "../class/User";
import { useEffect, useMemo, useState } from "react";

export default function TopBar() {
	const [userData, setUserData] = useState(null);
	const [avatarFailed, setAvatarFailed] = useState(false);

	useEffect(() => {
		const fetchUserData = async () => {
			const resData = User.getUserData();

			if (resData && resData.data) {
				setUserData(resData.data);
			}
		}

		fetchUserData();
	}, []);

	const pathname = usePathname();

	/* let title = "Dashboard";

	if (pathname.includes("study-sessions")) title = "Study Sessions";
	if (pathname.includes("stress")) title = "Stress Tracker";
	if (pathname.includes("notes")) title = "Study Notes";
	if (pathname.includes("quiz")) title = "Quiz";
	
	*/

	const titles = {
		"/view/dashboard": "Dashboard",
		"/view/study-sessions": "Study Sessions",
		"/view/stress-tracker": "Stress Tracker",
		"/view/study-notes": "Study Notes",
		"/view/quiz": "Quiz",
		"/view/subjects": "Subjects"
	}

	const title = useMemo(() => {
		if (!pathname) return "Dashboard";
		for (const path in titles) {
			if (pathname === path || pathname.startsWith(`${path}/`)) return titles[path];
		}
		return "Dashboard";
	}, [pathname]);

	const firstName = userData?.first_name || "User";
	const initials = (firstName?.trim()?.[0] || "U").toUpperCase();
	const profilePicture = userData?.profile_picture || null;
	const canShowAvatar = Boolean(profilePicture) && !avatarFailed;

	return (
		<header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/70 backdrop-blur">
			<div className="mx-auto flex h-[70px]  items-center justify-between gap-4 px-4 md:px-6">
				<div className="min-w-0">
					<h2 className="truncate text-xl font-semibold tracking-tight text-gray-900 md:text-2xl">
						{title}
					</h2>
					<p className="mt-0.5 hidden text-xs text-gray-500 sm:block">
						Keep going - small wins add up.
					</p>
				</div>

				<div className="flex items-center gap-2 sm:gap-3">
					{/* <button
						type="button"
						className="relative grid h-10 w-10 place-items-center rounded-xl border border-gray-200/70 bg-white/80 text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-200"
						aria-label="Notifications"
					>
						<span aria-hidden="true" className="text-[18px] leading-none">🔔</span>
						<span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-violet-500" aria-hidden="true" />
					</button> */}

					<div className="flex items-center gap-2 rounded-2xl border border-gray-200/70 bg-white/80 p-1.5 pl-2 shadow-sm">
						<div className="flex min-w-0 flex-col pr-1">
							<span className="max-w-[120px] truncate text-sm font-medium text-gray-900 sm:max-w-[180px]">
								{firstName}
							</span>
							<span className="hidden text-xs text-gray-500 sm:block">Student</span>
						</div>

						<div className="h-9 w-9 overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 p-[1px]">
							<div className="grid h-full w-full place-items-center overflow-hidden rounded-xl bg-white/90">
								{canShowAvatar ? (
									<img
										src={profilePicture}
										alt={`${firstName} avatar`}
										className="h-full w-full object-cover"
										referrerPolicy="no-referrer"
										onError={() => setAvatarFailed(true)}
									/>
								) : (
									<span className="text-sm font-semibold text-gray-800">{initials}</span>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</header>
	);
}