-- Test-Schalter: bei diesen Mitgliedern kommt die Feedback-Frage bei jedem
-- Öffnen der App (ohne Zufall und ohne Pause) — zum Ausprobieren.
alter table members
  add column feedback_always boolean not null default false;
