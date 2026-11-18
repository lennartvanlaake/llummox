UPDATE subtasks
SET status = :status,
    title = :title,
    description = :description,
    schema = :schema,
    result = :result,
    "order" = :order
WHERE id = :id
RETURNING *;
