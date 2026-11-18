INSERT INTO subtasks (id, status, taskId, title, description, schema, result, "order")
VALUES (:id, :status, :taskId, :title, :description, :schema, :result, :order)
RETURNING *;
