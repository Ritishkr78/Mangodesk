require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const Groq = require("groq-sdk");
const multer = require("multer");
const mammoth = require("mammoth");
const xlsx = require("xlsx");
const pdf = require("pdf-parse");
const fs = require("fs");
const { marked } = require("marked");

const upload = multer({ dest: "uploads/" });

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// New endpoint for file upload and text extraction
app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  let text = "";
  const filePath = req.file.path;

  try {
    if (req.file.mimetype === "application/pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      text = data.text;
    } else if (
      req.file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } else if (
      req.file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      text = xlsx.utils.sheet_to_csv(worksheet);
    } else if (req.file.mimetype === "text/plain") {
      text = fs.readFileSync(filePath, "utf8");
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "Unsupported file type." });
    }

    fs.unlinkSync(filePath);

    if (!text || !text.trim()) {
      return res.status(400).json({
        error:
          "Could not extract text from the file. It may be an image, a scanned document, or empty.",
      });
    }

    res.json({ transcript: text });
  } catch (error) {
    console.error("File processing error:", error);
    fs.unlinkSync(filePath);
    res.status(400).json({
      error:
        "Could not extract text from the file. It may be a corrupted, secured, or scanned document.",
    });
  }
});

// Helper function to summarize a chunk or combine summaries
async function summarize(text, prompt, isCombining = false) {
  const model = isCombining ? "llama3-70b-8192" : "llama3-8b-8192";
  const systemContent = isCombining
    ? `You are a master synthesizer. Your task is to combine multiple summary fragments into a single, final, professionally formatted meeting summary. The user's original prompt was: "{prompt}". Use the fragments to construct a coherent summary. The final output must follow this structure exactly, using Markdown for formatting:

### Subject: [Concise and descriptive subject line]

**Key Discussion Points:**
- [Bulleted list of the most important topics discussed]
- [Each point should be clear and concise]

**Action Items:**
1. [Numbered list of specific tasks assigned]
2. [Include who is responsible if mentioned]

**Next Steps:**
- [Bulleted list of future plans or upcoming meetings]

Directly output the formatted summary without any introductions, conversational text, or explanations.`
    : `You are a professional meeting assistant. Your task is to summarize the provided text based on the user's prompt: "{prompt}". The final output must be formatted as a professional email summary. Follow this structure exactly, using Markdown for formatting:

### Subject: [Concise and descriptive subject line]

**Key Discussion Points:**
- [Bulleted list of the most important topics discussed]
- [Each point should be clear and concise]

**Action Items:**
1. [Numbered list of specific tasks assigned]
2. [Include who is responsible if mentioned]

**Next Steps:**
- [Bulleted list of future plans or upcoming meetings]

Directly output the formatted summary without any introductions, conversational text, or explanations.`;

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemContent },
      {
        role: "user",
        content: `Original Prompt: "${prompt}"\n\nText to process:\n"${text}"`,
      },
    ],
    model: model,
  });
  return chatCompletion.choices[0]?.message?.content || "";
}

app.post("/api/summarize", async (req, res) => {
  const { transcript, prompt } = req.body;
  const CHUNK_SIZE = 10000;
  const BATCH_SIZE = 5;
  const REDUCE_GROUP_SIZE = 5;
  const PACING_DELAY_MS = 1000;

  if (!transcript || !prompt) {
    return res
      .status(400)
      .json({ error: "Transcript and prompt are required." });
  }

  try {
    let chunks = [];
    for (let i = 0; i < transcript.length; i += CHUNK_SIZE) {
      chunks.push(transcript.substring(i, i + CHUNK_SIZE));
    }

    let summaries = [];
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const batchSummaries = await Promise.all(
        batch.map((chunk) => summarize(chunk, prompt, false))
      );
      summaries.push(...batchSummaries);
      if (i + BATCH_SIZE < chunks.length) {
        await new Promise((resolve) => setTimeout(resolve, PACING_DELAY_MS));
      }
    }

    let currentSummaries = summaries;
    while (currentSummaries.length > 1) {
      const nextLevelSummaries = [];
      const groups = [];
      for (let i = 0; i < currentSummaries.length; i += REDUCE_GROUP_SIZE) {
        groups.push(
          currentSummaries.slice(i, i + REDUCE_GROUP_SIZE).join("\n\n---\n\n")
        );
      }

      for (let i = 0; i < groups.length; i += BATCH_SIZE) {
        const batch = groups.slice(i, i + BATCH_SIZE);
        const combinedBatch = await Promise.all(
          batch.map((group) => summarize(group, prompt, true))
        );
        nextLevelSummaries.push(...combinedBatch);
        if (i + BATCH_SIZE < groups.length) {
          await new Promise((resolve) => setTimeout(resolve, PACING_DELAY_MS));
        }
      }
      currentSummaries = nextLevelSummaries;
    }

    const finalSummary =
      currentSummaries[0] || "Sorry, I could not generate a final summary.";

    res.json({ summary: finalSummary });
  } catch (error) {
    console.error("Groq API Error:", error);
    res
      .status(500)
      .json({ error: "Failed to generate summary from Groq API." });
  }
});

// Endpoint to handle sending email
app.post("/api/send-email", async (req, res) => {
  const { summary, recipients } = req.body;

  if (!summary || !recipients || recipients.length === 0) {
    return res
      .status(400)
      .json({ error: "Summary and at least one recipient are required." });
  }

  // Validate email addresses
  const transporter = nodemailer.createTransport({
    service: "gmail", // Or your preferred email service
    auth: {
      user: process.env.EMAIL_USER || "your-email@example.com", // Placeholder
      pass: process.env.EMAIL_PASS || "your-password", // Placeholder
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER || "your-email@example.com",
    to: recipients.join(","),
    subject: "Your Generated Meeting Summary",
    html: marked(summary), // Convert Markdown to HTML
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    console.error("Email sending error:", error);
    res.status(500).json({ error: "Failed to send email." });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
