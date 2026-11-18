SELECT * FROM subtasks
WHERE taskId = :taskId AND status = :status
LIMIT 1;
