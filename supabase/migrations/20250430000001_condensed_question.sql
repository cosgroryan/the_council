-- Add condensed_question column to sessions
-- Stores the synthesizer's trimmed/neutral version of the question for
-- display in shared links, PDFs, and the session log detail view.
ALTER TABLE public.sessions
  ADD COLUMN condensed_question TEXT;
