'use client';

import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import "quill/dist/quill.snow.css";
import { fetchNotes } from '../services/StudyNoteService';

const TextEditor = ({ sessionId, onChange }) => { // 1. Accept the prop
    const editorRef = useRef(null);
    const quillRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true)

    const loadExistingNotes = async () => {
        if (sessionId && quillRef.current) {
            try {
                const response = await fetchNotes({ session_id: sessionId });
                console.log('notes', response);

                if (response.length <= 0) {
                    setIsLoading(false)
                    return;
                }

                if (!response[0].note_text) {
                    setIsLoading(false)
                    return;
                }

                const existingNotes = response[0].note_text

                if (existingNotes) {
                    quillRef.current.root.innerHTML = existingNotes;
                }
                setIsLoading(false)
            } catch (error) {
                console.error("Failed to fetch notes:", error);
            }
        }
    };

    useEffect(() => {
        loadExistingNotes();
    }, [sessionId]);

    useEffect(() => {
        if (editorRef.current && !quillRef.current) {
            const quill = new Quill(editorRef.current, {
                theme: 'snow',
                placeholder: 'Type your notes here...',
            });
            quillRef.current = quill;

            // 2. Listen for changes and send them back to the caller
            quill.on('text-change', () => {
                const html = quill.root.innerHTML;
                const notes = {
                    session_id: sessionId,
                    note_text: html
                }
                if (onChange) {
                    onChange(notes); // 3. Execute the callback
                }
            });
        }
    }, [onChange]); // Add onChange to dependency array

    return (
        <div className="flex-1 flex flex-col overflow-hidden border border-gray-200 relative">
            {isLoading ? (
                /* Loading Overlay */
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-emerald-600" />
                        <span className="text-sm font-medium text-gray-600">Loading notes...</span>
                    </div>
                </div>
            ) : null}

            {/* The Editor remains in the DOM but is covered by the overlay while loading */}
            <div ref={editorRef} className="flex-1 overflow-y-auto" />
        </div>
    );
};

export default TextEditor;