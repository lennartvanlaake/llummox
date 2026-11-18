SELECT * FROM subtasks
WHERE taskId = :taskId AND status = :status
ORDER BY "order"
LIMIT 1;
