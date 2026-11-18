DELETE FROM subtasks WHERE id = :id RETURNING *;
