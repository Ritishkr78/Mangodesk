import { useState } from "react";
import axios from "axios";
import FileUpload from "./components/FileUpload";
import PromptInput from "./components/PromptInput";
import SummaryDisplay from "./components/SummaryDisplay";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

function App() {
  const [transcript, setTranscript] = useState("");
  const [prompt, setPrompt] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [recipients, setRecipients] = useState("");
  const [emailStatus, setEmailStatus] = useState({
    message: "",
    isError: false,
  });
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const processFile = async (file) => {
    if (!file) {
      return;
    }

    const getFileExtension = (filename) => {
      return filename
        .slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2)
        .toLowerCase();
    };

    const extension = getFileExtension(file.name);
    const allowedExtensions = ["txt", "pdf", "docx", "xlsx"];

    const allowedTypes = [
      "text/plain",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(extension)
    ) {
      setError(
        `Unsupported file. Please upload a TXT, PDF, DOCX, or XLSX file. (Detected type: ${file.type}, extension: .${extension})`
      );
      return;
    }

    setFileName(file.name);
    setIsLoading(true);
    setError("");
    setTranscript("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!response.data.transcript || !response.data.transcript.trim()) {
        setError(
          "Could not extract text from the file. It may be an image, a scanned document, or empty."
        );
        setTranscript(""); // Clear transcript if new file is invalid
        setSummary(""); // Clear summary if new file is invalid
      } else {
        setTranscript(response.data.transcript); // Set new transcript on success
        setSummary(""); // Clear old summary when new transcript is ready
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        "Failed to upload and process file. Please try again.";
      setError(
        typeof errorMessage === "string"
          ? errorMessage
          : JSON.stringify(errorMessage)
      );
      console.error(err);
    }
    setIsLoading(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    processFile(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    processFile(file);
  };

  const handleGenerateSummary = async () => {
    if (!transcript.trim() || !prompt.trim()) {
      setError("Please provide both a transcript and a prompt.");
      return;
    }
    setIsLoading(true);
    setError("");
    setSummary("");
    try {
      const response = await axios.post(`${API_BASE_URL}/api/summarize`, {
        transcript,
        prompt,
      });
      setSummary(response.data.summary);
    } catch (err) {
      setError("Failed to generate summary. Please try again.");
      console.error(err);
    }
    setIsLoading(false);
  };

  const validateEmail = (email) => {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSendEmail = async () => {
    // 1. Immediate Validation
    if (!summary.trim() || !recipients.trim()) {
      setEmailStatus({
        message: "Please provide a summary and at least one recipient.",
        isError: true,
      });
      return;
    }

    const recipientList = recipients.split(",").map((email) => email.trim());
    const invalidEmails = recipientList.filter(
      (email) => !validateEmail(email)
    );

    // 2. State Update & Early Exit for invalid emails
    if (invalidEmails.length > 0) {
      setEmailStatus({
        message: `Invalid email address(es): ${invalidEmails.join(
          ", "
        )}. Please correct them.`,
        isError: true,
      });
      return;
    }

    // 3. Proceed Only if Valid: Set loading and clear previous status
    setIsLoading(true);
    setEmailStatus({ message: "", isError: false });

    try {
      await axios.post(`${API_BASE_URL}/api/send-email`, {
        summary,
        recipients: recipientList,
      });
      setEmailStatus({ message: "Email sent successfully!", isError: false });
    } catch (err) {
      setEmailStatus({
        message: "Failed to send email. Please check the console.",
        isError: true,
      });
      console.error(err);
    } finally {
      // 4. Clearer State Management: Always reset loading state
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-200 to-gray-700 font-sans">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl pb-2 sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-700  to-black tracking-tight">
            Mango Desk Meeting Summarizer
          </h1>
          <p className="text-lg text-black mt-4 max-w-2xl mx-auto">
            Transform lengthy meeting transcripts into clear, concise summaries
            with the power of AI.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl-soft border border-slate-200/80 transition-all duration-300 hover:shadow-lg-soft hover:-translate-y-1">
            {error && (
              <div
                className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg"
                role="alert"
              >
                <p className="font-bold">Oops!</p>
                <p>{error}</p>
              </div>
            )}
            <FileUpload
              isDragging={isDragging}
              fileName={fileName}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              handleFileChange={handleFileChange}
              transcript={transcript}
              setTranscript={setTranscript}
            />
            <PromptInput prompt={prompt} setPrompt={setPrompt} />
            <div className="text-center mt-8">
              <button
                onClick={handleGenerateSummary}
                disabled={isLoading || !transcript.trim() || !prompt.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold py-4 px-8 rounded-xl hover:from-purple-700 hover:to-blue-600 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
              >
                {isLoading && !summary
                  ? "Generating..."
                  : "✨ Generate Summary"}
              </button>
            </div>
          </div>

          <SummaryDisplay
            summary={summary}
            setSummary={setSummary}
            recipients={recipients}
            setRecipients={setRecipients}
            emailStatus={emailStatus}
            handleSendEmail={handleSendEmail}
            isLoading={isLoading}
          />
        </div>
        <footer className="text-center mt-16 text-blatext-sm">
          <p>
            &copy; {new Date().getFullYear()} Mango Desk. All Rights Reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
