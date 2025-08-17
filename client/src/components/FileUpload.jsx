import React from "react";

const FileUpload = ({
  isDragging,
  fileName,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileChange,
  transcript,
  setTranscript,
}) => {
  return (
    <div className="mb-8">
      <div className="flex items-center text-xl font-bold text-slate-700 mb-4">
        <span className="bg-slate-800 text-white rounded-full h-9 w-9 flex items-center justify-center mr-4 shadow">
          1
        </span>
        Provide Transcript
      </div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-4 flex justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-all duration-300 ${
          isDragging
            ? "border-purple-500 bg-purple-50"
            : "border-slate-300 hover:border-slate-400"
        }`}
      >
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-slate-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <div className="mt-4 flex text-sm leading-6 text-slate-600">
            <label
              htmlFor="file-upload"
              className="relative place-content-center cursor-pointer rounded-md font-semibold text-purple-600 hover:text-purple-500 transition"
            >
              <span>Upload a file</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept=".txt,.pdf,.docx,.xlsx"
                onChange={handleFileChange}
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs leading-5 text-slate-500">
            TXT, PDF, DOCX, XLSX
          </p>
          {fileName && (
            <p className="text-sm font-medium text-green-600 mt-3">
              Selected: {fileName}
            </p>
          )}
        </div>
      </div>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-300" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-2 text-sm text-slate-500">OR</span>
        </div>
      </div>
      <textarea
        id="transcript-area"
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Paste your transcript here..."
        className="w-full p-4 border border-gray-300 rounded-xl h-40 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition shadow-sm"
      />
    </div>
  );
};

export default FileUpload;
