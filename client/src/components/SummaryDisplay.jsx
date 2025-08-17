import React from "react";

const SummaryDisplay = ({
  summary,
  setSummary,
  recipients,
  setRecipients,
  emailStatus,
  handleSendEmail,
  isLoading,
}) => {
  return (
    <div className="bg-white/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl-soft border border-slate-200/80 sticky top-8 transition-all duration-300 hover:shadow-lg-soft hover:-translate-y-1">
      <div className="flex items-center text-xl font-bold text-slate-800 mb-4">
        <span className="bg-cyan-500 text-white rounded-full h-9 w-9 flex items-center justify-center mr-4 shadow-md">
          3
        </span>
        Review & Share
      </div>
      {isLoading && !summary ? (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-purple-500"></div>
        </div>
      ) : (
        <>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Your AI-generated summary will appear here..."
            className="w-full p-4 border border-slate-300 rounded-xl h-80 bg-slate-50/80 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition shadow-sm"
          />
          {summary && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">
                Share via Email
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  placeholder="recipient@example.com"
                  className="flex-grow p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition shadow-sm"
                />
                <button
                  onClick={handleSendEmail}
                  disabled={isLoading || !recipients.trim()}
                  className="bg-gradient-to-r from-cyan-500 to-teal-400 text-white font-bold py-3 px-6 rounded-xl hover:from-cyan-600 hover:to-teal-500 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-300 ease-in-out shadow-lg"
                >
                  {isLoading && !emailStatus.isError ? "Sending..." : "Send"}
                </button>
              </div>
              {emailStatus.message && (
                <p
                  className={`text-sm mt-3 ${
                    emailStatus.isError ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {emailStatus.message}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SummaryDisplay;
