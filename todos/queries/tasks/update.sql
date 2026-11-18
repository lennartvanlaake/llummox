UPDATE tasks
SET status = :status,
    prompt = :prompt,
    data = :data,
    notes = :notes
WHERE id = :id
RETURNING *;
