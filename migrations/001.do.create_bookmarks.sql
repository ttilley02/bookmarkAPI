create table bookmarks (
  id INTEGER primary key generated by default as identity,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  rating INTEGER NOT NULL
);