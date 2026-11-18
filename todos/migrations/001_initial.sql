CREATE TABLE tasks (
  id TEXT PRIMARY KEY NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  prompt TEXT NOT NULL,
  data TEXT DEFAULT '{}',
  notes TEXT,
  createdAt INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subtasks (
  id TEXT PRIMARY KEY NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  taskId TEXT NOT NULL REFERENCES tasks(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  schema TEXT,
  result TEXT,
  createdAt INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "order" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE task_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  taskId TEXT NOT NULL,
  type TEXT NOT NULL,
  createdAt INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX subtasks_taskId_order ON subtasks (taskId, "order");

CREATE TRIGGER tasks_after_insert
AFTER INSERT ON tasks
BEGIN
  INSERT INTO task_events (taskId, type) VALUES (NEW.id, 'task.created');
END;

CREATE TRIGGER tasks_after_update
AFTER UPDATE ON tasks
BEGIN
  INSERT INTO task_events (taskId, type) VALUES (NEW.id, 'task.updated');
END;

CREATE TRIGGER tasks_after_delete
AFTER DELETE ON tasks
BEGIN
  INSERT INTO task_events (taskId, type) VALUES (OLD.id, 'task.deleted');
END;

CREATE TRIGGER subtasks_after_insert
AFTER INSERT ON subtasks
BEGIN
  INSERT INTO task_events (taskId, type) VALUES (NEW.taskId, 'subtask.created');
END;

CREATE TRIGGER subtasks_after_update
AFTER UPDATE ON subtasks
BEGIN
  INSERT INTO task_events (taskId, type) VALUES (NEW.taskId, 'subtask.updated');
END;

CREATE TRIGGER subtasks_after_delete
AFTER DELETE ON subtasks
BEGIN
  INSERT INTO task_events (taskId, type) VALUES (OLD.taskId, 'subtask.deleted');
END;
