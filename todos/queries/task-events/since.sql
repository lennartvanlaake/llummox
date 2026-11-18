SELECT id, taskId, type FROM task_events
WHERE id > :id
ORDER BY id;
