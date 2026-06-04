'use client'

import React, { useEffect, useState } from 'react'
import Modal from '@/app/components/ui/modal'
import SubjectForm from '@/app/components/SubjectForm'
import SubjectList from '@/app/components/SubjectList'
import { fetchSubjects, deleteSubject } from '@/app/services/SubjectService'
import toast from "react-hot-toast"

const Subjects = () => {
  const [isOpenForm, setIsOpenForm] = useState(false)
  const [isOpenEditForm, setIsOpenEditForm] = useState(false)
  const [selectedSubjectId, setSelectedSubjectId] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [mounted, setMounted] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [subjectToDelete, setSubjectToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const closeForm = () => setIsOpenForm(false)

  const handleDelete = async (id) => {
    try {
      setIsDeleting(true)
      const data = await deleteSubject(id)
      if (data.success) {
        toast.success("Subject deleted successfully")
        if (subjects.length === 1) {
          window.location.reload()
        } else {
          fetchSubject()
        }
      } else {
        toast.error(data.message || "Failed to delete subject")
      }
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong")
    } finally {
      setIsDeleting(false)
    }
  }

  const fetchSubject = async () => {
    const data = await fetchSubjects()
    if (data.length > 0) setSubjects(data)
  }

  const closeEditForm = () => {
    setIsOpenEditForm(false)
    setSelectedSubjectId(null)
  }

  const openEditForm = (id) => {
    setSelectedSubjectId(id)
    setIsOpenEditForm(true)
  }

  const openDeleteModal = (id) => {
    setSubjectToDelete(id)
    setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setSubjectToDelete(null)
    setShowDeleteModal(false)
  }

  useEffect(() => {
    fetchSubject()
    const t = setTimeout(() => setMounted(true), 30)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="font-sans">

      {/* ── Header ── */}
      <div
        className={`flex items-end justify-between pb-[22px] border-b border-[#f0ede6] mb-9 transition-all duration-400 ease-out
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2.5'}`}
      >
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1.5">
            Learning Hub
          </p>
          <h1 className="font-['Instrument_Serif'] text-[clamp(26px,3.5vw,38px)] font-normal leading-[1.1] tracking-[-0.02em] text-stone-900 m-0">
            Your <em className="italic text-indigo-500">Subjects</em>
          </h1>
        </div>

        <div className="flex items-center gap-[18px]">
          {subjects.length > 0 && (
            <span className="text-xs text-stone-400 tracking-wide">
              {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
            </span>
          )}
          <button
            className="inline-flex items-center gap-2 px-[18px] py-2.5 rounded-[10px] border border-[#e7e4dd] bg-white text-stone-900 font-sans text-[13px] font-medium cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-200 hover:border-indigo-400 hover:shadow-[0_4px_12px_rgba(99,102,241,0.15)] hover:-translate-y-px active:translate-y-0"
            onClick={() => setIsOpenForm(true)}
          >
            <span className="w-[18px] h-[18px] rounded-[5px] bg-indigo-500 text-white inline-flex items-center justify-center text-[15px] leading-none shrink-0">
              +
            </span>
            Add Subject
          </button>
        </div>
      </div>

      {/* ── Modals ── */}
      {isOpenForm && (
        <Modal>
          <SubjectForm closeForm={closeForm} refreshList={fetchSubject} />
        </Modal>
      )}

      {isOpenEditForm && selectedSubjectId && (
        <Modal>
          <SubjectForm closeForm={closeEditForm} refreshList={fetchSubject} subjectId={selectedSubjectId} />
        </Modal>
      )}

      {showDeleteModal && (
        <Modal onClose={closeDeleteModal}>
          <div className="rounded-3xl p-2 flex flex-col items-center text-center bg-white">

            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5">
              <span className="text-5xl">🗑️</span>
            </div>

            <h2 className="text-xl font-bold text-stone-800 mb-2">
              Delete Subject?
            </h2>
            <p className="text-sm text-stone-400 leading-relaxed max-w-[220px]">
              This subject will be permanently deleted and cannot be recovered.
            </p>

            <div className="flex gap-3 w-full mt-8">
              <button
                className="flex-1 py-3 rounded-xl border border-red-200 text-red-400 font-medium hover:bg-red-50 transition-all"
                onClick={closeDeleteModal}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg shadow-red-200 transition-all"
                onClick={async () => {
                  await handleDelete(subjectToDelete)
                  closeDeleteModal()
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Deleting overlay ── */}
      {isDeleting && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-10 shadow-2xl">
            <div className="flex flex-col items-center justify-center">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              <p className="mt-6 text-lg font-medium text-stone-700">
                Deleting subject...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div
        className={`transition-all duration-[450ms] ease-out delay-100
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
      >
        {subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 border-[1.5px] border-dashed border-[#e7e4dd] rounded-2xl bg-[#faf9f7]">
            <div className="w-16 h-16 rounded-2xl bg-[#f0eeff] border border-[#ddd9ff] flex items-center justify-center text-[26px] mb-5">
              📚
            </div>
            <p className="font-['Instrument_Serif'] italic text-xl text-stone-900 mb-2">
              No subjects yet
            </p>
            <p className="text-[13px] text-stone-400 mb-6">
              Start by adding your first subject
            </p>
            <button
              className="inline-flex items-center gap-[7px] px-5 py-2.5 rounded-[10px] bg-indigo-500 hover:bg-indigo-600 text-white border-none font-sans text-[13px] font-medium cursor-pointer shadow-[0_4px_12px_rgba(99,102,241,0.25)] transition-all duration-200 hover:-translate-y-px"
              onClick={() => setIsOpenForm(true)}
            >
              <span className="text-[15px]">+</span>
              Add your first subject
            </button>
          </div>
        ) : (
          <SubjectList
            refreshList={fetchSubject}
            subjects={subjects}
            openEditForm={openEditForm}
            deleteSubject={openDeleteModal}
          />
        )}
      </div>
    </div>
  )
}

export default Subjects