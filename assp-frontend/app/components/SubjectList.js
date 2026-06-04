'use client'

import React, { useEffect } from 'react'
import { useState } from 'react'
import Modal from '@/app/components/ui/modal'
import SubjectForm from '@/app/components/SubjectForm'
import { refresh } from 'next/cache'

const SubjectList = ({ refreshList, subjects, openEditForm, deleteSubject }) => {
	return (
		<>
			<div>
				{subjects.length > 0 ? (
					<div className="grid grid-cols-3 gap-4">
						{subjects.map((subject) => (
							<div
								key={subject.subject_id}
								className="flex flex-col border rounded h-32 "
							>
								<span
									className="w-full h-12 mr-2"
									style={{ backgroundColor: subject.color }} // Uses the color field [cite: 44]
								></span>
								<div className='p-3'>
									<span className=''>{subject.name}</span> {/* Uses the name field  */}
									<div className="flex gap-2 mt-4">
										{/* <button className="flex-1 text-xs py-2 bg-blue-200 text-blue-600 rounded hover:bg-blue-300 transition-colors">
										View Details
									</button> */}
										<button
											onClick={() => openEditForm(subject.subject_id)}
											className="flex-1 text-xs py-2 bg-yellow-200 text-gray-700 rounded hover:bg-yellow-300 transition-colors"
										>
											Edit
										</button>
										<button
											className="flex-1 text-xs py-2 bg-red-200 text-red-600 rounded hover:bg-red-300 transition-colors"
											onClick={() => {
												deleteSubject(subject.subject_id);
											}}
										>
											Delete
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<p className="text-gray-500">No subjects added yet.</p>
				)}
			</div>
		</>
	)
}

export default SubjectList