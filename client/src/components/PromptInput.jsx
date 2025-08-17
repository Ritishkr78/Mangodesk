import React from "react";

const PromptInput = ({ prompt, setPrompt }) => {
  return (
    <div className="mb-4">
      <div className="flex items-center text-xl font-bold text-slate-700 mb-4">
        <span className="bg-slate-800 text-white rounded-full h-9 w-9 flex items-center justify-center mr-4 shadow">
          2
        </span>
        Set Your Prompt
      </div>
      <input
        id="prompt"
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g., 'Summarize this document'"
        className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition shadow-sm"
      />
    </div>
  );
};

export default PromptInput;
