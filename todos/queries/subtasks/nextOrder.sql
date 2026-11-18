SELECT COALESCE(MAX("order") + 1, 0) AS "order"
FROM subtasks
WHERE taskId = :taskId;
