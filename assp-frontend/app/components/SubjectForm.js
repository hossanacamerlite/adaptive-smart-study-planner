import React, { useEffect } from 'react'
import { useState } from 'react'
import { saveSubject } from '../services/SubjectService'
import { fetchSubjects } from '../services/SubjectService'
import { Palette } from "lucide-react";
import toast from "react-hot-toast";

const SubjectForm = ({ closeForm, refreshList, subjectId = null }) => {
	const [name, setName] = useState("")
	const [color, setColor] = useState("#4359fe")
	const [isLoading, setIsLoading] = useState(false);
	const fetchSubject = async () => {
		setIsLoading(true); // Start loading
		try {
			const params = { subject_id: subjectId };
			const data = await fetchSubjects(params);

			if (data.length > 0) {
				setName(data[0].name || "");
				setColor(data[0].color || "#4359fe"); // Fixed: set color correctly
			}
		} catch (error) {
			console.error("Error fetching subject:", error);
		} finally {
			setIsLoading(false); // Stop loading regardless of success/fail
		}
	}

	useEffect(() => {
		if (subjectId) {
			fetchSubject();
		}
	}, [subjectId])

	const handleSave = async () => {
		if (name.length <= 0) {
			alert("Please enter a name");
			return;
		}

		setIsLoading(true);

		try {
			const subject = {
				name,
				color,
				...(subjectId && { subject_id: subjectId })
			};

			const data = await saveSubject(subject);

			if (data.success) {
				toast.success("Subject created successfully!");
				closeForm();
				refreshList();
			} else {
				alert(data.error);
			}
		} catch (error) {
			console.error(error);
			alert("Something went wrong");
		} finally {
			setIsLoading(false);
		}
	};

	const subjectColors = [
		"#3B82F6", // blue
		"#10B981", // green
		"#8B5CF6", // purple
		"#F59E0B", // orange
		"#EC4899", // pink
		"#14B8A6", // teal
		"#EF4444"  // red
	];

	if (isLoading) {
		return (
			<div className="w-full max-w-md rounded-2xl p-6 shadow-2xl min-h-[200px] flex flex-col items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
				<p className="mt-4 text-gray-600 font-medium">
					Saving subject...
				</p>
			</div>
		);
	}

	return (
		<div className="w-full max-w-md rounded-2x p-6 flex flex-col">
			<>
				<h3 className="text-lg font-semibold mb-4">
					{subjectId ? "Edit Subject" : "Add Subject"}
				</h3>

				<div className='flex flex-col gap-4 mb-6'>
					<div className='flex items-center gap-3'>
						<label className="block text-sm font-medium w-16">Name:</label>
						<input
							value={name}
							placeholder="e.g Maths, Science"
							className="flex-1 border p-2 rounded"
							onChange={(e) => setName(e.target.value)}
						/>
					</div>

					<div className="flex items-start gap-3">
						<label className="block text-sm font-medium w-16 pt-2">Color:</label>
						<div className="flex flex-wrap items-center gap-3">
							{subjectColors.map((c) => (
								<button
									key={c}
									type="button"
									onClick={() => setColor(c)}
									className={`w-10 h-10 rounded-full border-4 transition-all ${color === c ? "border-black scale-110" : "border-gray-300"
										}`}
									style={{ backgroundColor: c }}
								/>
							))}

							{/* Custom Color Picker */}
							<label
								className="relative w-10 h-10 rounded-full border-4 border-gray-300 cursor-pointer hover:scale-110 transition-all flex items-center justify-center"
								style={{ backgroundColor: color }}
							>
								<Palette size={18} className="text-gray-600" /><Palette
									size={18}
									className={`${color === "#ffffff" || color === "#fff"
											? "text-gray-600"
											: "text-white"
										}`}
								/>

								<input
									type="color"
									value={color}
									onChange={(e) => setColor(e.target.value)}
									className="absolute inset-0 opacity-0 cursor-pointer"
								/>
							</label>
						</div>
					</div>
				</div>

				<div className="flex gap-2  pt-4">
					<button
						className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 shadow-sm transition-colors"
						onClick={handleSave}
					>
						{subjectId ? "Update Subject" : "Save Subject"}
					</button>
					<button
						className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
						onClick={closeForm}
					>
						Cancel
					</button>
				</div>
			</>
		</div>
	)
}

export default SubjectForm