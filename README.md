# wip:wd's Tasks

A task manager for the browser, follows a Kanban style to task management:
a new task is placed under the backlog, and is moved forward by the user as
progress on the task is achieved. At any point in time a task can be moved
back to the backlog, unless it has been completed.

The current implementation keeps tasks stored in the browser's IndexedDB,
and thus requires no backend to function. However, an obvious limitation is
that these tasks are not shared across devices, nor across browsers.

## LICENSE

This work is distributed under the European Union Public License version 1.2,
as published by the European Commission. You may find a copy of the license in
this repository, under LICENSE.
