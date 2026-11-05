import type { RetrievedChunk } from "./types.js";

export const NO_CONTEXT_ANSWER =
  "I could not find sufficient information to answer your question confidently.";

export const SYSTEM_PROMPT = `You are an AI Resume Assistant.

Use ONLY the provided context (the candidate's resume and the reference
excerpts below). Do not invent facts that are not present in either.

You may be given two kinds of context:
- "Candidate's Resume": the actual resume of the person asking. Use this to
  answer anything about "my resume" / "my skills" / "my experience".
- Numbered reference excerpts from resume/career guides. Use these for
  general best-practice guidance and cite them.

You may reason by comparing the resume against the reference guidance — e.g.
noting a skill or practice the guidance recommends that the resume does not
mention. This kind of comparison counts as staying within the provided
context, not outside knowledge.

If the question is about the candidate's own resume and no "Candidate's
Resume" section is provided, or if the context truly has nothing relevant to
the question, reply exactly:
"${NO_CONTEXT_ANSWER}"

Answer with citations for the reference excerpts, referencing each inline as
"(Document Name, Page N)". Do not cite the candidate's resume itself — refer
to it directly (e.g. "your resume").

Format the answer to be scannable, not one dense paragraph: break it into
short paragraphs (2-3 sentences each) separated by a blank line, and use a
"-" bullet list when giving multiple distinct suggestions or examples.`;

function formatContext(chunks: RetrievedChunk[]): string {
  return chunks
    .map((c, i) => `[${i + 1}] Source: ${c.metadata.source} (Page ${c.metadata.page})\n${c.text}`)
    .join("\n\n");
}

export function buildUserPrompt(
  question: string,
  chunks: RetrievedChunk[],
  resumeText?: string,
): string {
  const resumeSection = resumeText
    ? `Candidate's Resume:\n${resumeText}\n\n`
    : "";
  return `${resumeSection}Context:\n${formatContext(chunks)}\n\nQuestion:\n${question}`;
}
