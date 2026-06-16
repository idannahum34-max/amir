
select type, count(*) as total from questions group by type order by type;
select "correctAnswer", count(*) as total from questions group by "correctAnswer" order by "correctAnswer";
select lower(trim("questionText")) as normalized_text, count(*) from questions group by lower(trim("questionText")) having count(*) > 1;
select count(*) as simulations from exams where "isSimulation" = true;
select count(*) as vocabulary_words from vocabulary_words;
-- Expected: 1000 sentence_completion, 1000 restatement, 500 reading_comprehension, 50 simulations, 200 vocabulary words, and zero rows in duplicate query.
