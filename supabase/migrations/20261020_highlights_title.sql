-- Optional headline for each "Check these out!" card, shown above the caption.

alter table public.highlights
  add column title text
  constraint highlights_title_length check (title is null or char_length(title) <= 120);
