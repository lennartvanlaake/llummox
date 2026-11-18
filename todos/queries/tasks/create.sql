INSERT INTO tasks (id, status, prompt, data, notes)
VALUES (:id, :status, :prompt, :data, :notes)
RETURNING *;
