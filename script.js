document.addEventListener('DOMContentLoaded', () => {
    const addButton = document.getElementById('add-button');
    const todoInput = document.getElementById('todo-input');
    const deadlineInput = document.getElementById('deadline-input');
    const setDeadlineButton = document.getElementById('set-deadline-button');
    const categoryInput = document.getElementById('category-input');
    const todoList = document.getElementById('todo-list').querySelector('tbody');
    const doneList = document.getElementById('done-list').querySelector('tbody');
    const missedList = document.getElementById('missed-list').querySelector('tbody');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    loadTasks();

    // Add task
    addButton.addEventListener('click', addTask);

    // Search tasks
    searchInput.addEventListener('input', (e) => filterTasks(e.target.value.toLowerCase()));

    // Sort tasks
    sortSelect.addEventListener('change', (e) => sortTasks(e.target.value));

    // Set deadline
    setDeadlineButton.addEventListener('click', () => {
        deadlineInput.blur(); // Close the date-time picker
    });

    function addTask() {
        const taskText = todoInput.value.trim();
        const deadline = deadlineInput.value;
        const category = categoryInput.value;

        if (taskText === '' || deadline === '') {
            alert('Please enter a task and a deadline.');
            return;
        }

        const task = {
            id: Date.now(),
            text: taskText,
            deadline: deadline,
            category: category,
            isDone: false
        };

        tasks.push(task);
        saveTasks();

        const listItem = createListItem(task);
        todoList.appendChild(listItem);

        todoInput.value = '';
        deadlineInput.value = '';
        categoryInput.value = 'work';
    }

    function createListItem(task) {
        const listItem = document.createElement('tr');
        listItem.classList.add('fade-in');

        const taskCell = document.createElement('td');
        taskCell.textContent = task.text;

        const categoryCell = document.createElement('td');
        categoryCell.textContent = task.category;

        const deadlineCell = document.createElement('td');
        deadlineCell.textContent = new Date(task.deadline).toLocaleString();

        const remainingTimeCell = document.createElement('td');
        updateRemainingTime(remainingTimeCell, task.deadline);
        setInterval(() => updateRemainingTime(remainingTimeCell, task.deadline), 60000);

        const actionsCell = document.createElement('td');
        
        const editButton = document.createElement('button');
        editButton.innerHTML = '<i class="fas fa-edit"></i>';
        editButton.classList.add('edit');
        editButton.addEventListener('click', () => {
            const newTaskText = prompt('Edit task:', task.text);
            const newDeadline = prompt('Edit deadline (YYYY-MM-DDTHH:MM):', task.deadline);
            const newCategory = prompt('Edit category:', task.category);
            if (newTaskText !== null && newTaskText.trim() !== '') {
                task.text = newTaskText;
                task.deadline = newDeadline;
                task.category = newCategory;
                taskCell.textContent = newTaskText;
                deadlineCell.textContent = new Date(newDeadline).toLocaleString();
                categoryCell.textContent = newCategory;
                saveTasks();
            }
        });

        const doneButton = document.createElement('button');
        doneButton.innerHTML = task.isDone ? '<i class="fas fa-undo"></i>' : '<i class="fas fa-check"></i>';
        doneButton.classList.add(task.isDone ? 'undo' : 'done');
        doneButton.addEventListener('click', () => {
            task.isDone = !task.isDone;
            if (task.isDone) {
                doneList.appendChild(listItem);
                doneButton.innerHTML = '<i class="fas fa-undo"></i>';
                doneButton.classList.remove('done');
                doneButton.classList.add('undo');
            } else {
                todoList.appendChild(listItem);
                doneButton.innerHTML = '<i class="fas fa-check"></i>';
                doneButton.classList.remove('undo');
                doneButton.classList.add('done');
            }
            saveTasks();
        });

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
        deleteButton.classList.add('delete');
        deleteButton.addEventListener('click', () => {
            tasks = tasks.filter(t => t.id !== task.id);
            listItem.remove();
            saveTasks();
        });

        actionsCell.append(editButton, doneButton, deleteButton);

        listItem.append(taskCell, categoryCell, deadlineCell, remainingTimeCell, actionsCell);

        if (task.deadline) {
            checkDeadlines(listItem, task.deadline, task);
        }

        return listItem;
    }

    function updateRemainingTime(cell, deadline) {
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const timeDiff = deadlineDate - now;

        if (timeDiff <= 0) {
            cell.textContent = 'Missed';
        } else {
            const hours = Math.floor(timeDiff / 1000 / 60 / 60);
            const minutes = Math.floor((timeDiff / 1000 / 60) % 60);
            cell.textContent = `${hours}h ${minutes}m`;
        }
    }

    function checkDeadlines(listItem, deadline, task) {
        const deadlineDate = new Date(deadline);
        const now = new Date();
        const timeDiff = deadlineDate - now;

        if (timeDiff <= 0 && !task.isDone) {
            missedList.appendChild(listItem);
            notifyUser(task);
        } else {
            setTimeout(() => {
                checkDeadlines(listItem, deadline, task);
            }, 60000); // Check every minute
        }
    }

    function notifyUser(task) {
        if (Notification.permission === 'granted') {
            new Notification('Task Reminder', {
                body: `The task "${task.text}" is due soon!`
            });
        }
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        tasks.forEach(task => {
            const listItem = createListItem(task);
            if (task.isDone) {
                doneList.appendChild(listItem);
            } else if (new Date(task.deadline) < new Date()) {
                missedList.appendChild(listItem);
            } else {
                todoList.appendChild(listItem);
            }
        });
    }

    function filterTasks(query) {
        document.querySelectorAll('#todo-list tr, #done-list tr, #missed-list tr').forEach(row => {
            const taskText = row.querySelector('td').textContent.toLowerCase();
            if (taskText.includes(query)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    function sortTasks(sortBy) {
        tasks.sort((a, b) => {
            if (sortBy === 'deadline') {
                return new Date(a.deadline) - new Date(b.deadline);
            } else if (sortBy === 'priority') {
                return a.priority - b.priority;
            }
        });
        renderTasks();
    }

    function renderTasks() {
        todoList.innerHTML = '';
        doneList.innerHTML = '';
        missedList.innerHTML = '';
        tasks.forEach(task => {
            const listItem = createListItem(task);
            if (task.isDone) {
                doneList.appendChild(listItem);
            } else if (new Date(task.deadline) < new Date()) {
                missedList.appendChild(listItem);
            } else {
                todoList.appendChild(listItem);
            }
        });
    }
});
