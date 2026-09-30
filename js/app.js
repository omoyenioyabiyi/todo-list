const key = 'flowday-tasks-v1';
const initialTasks = [
  { id: 1, title: 'Send the project outline', tag: 'Work', done: false, focus: true, created: Date.now() },
  { id: 2, title: 'Take a 20-minute walk', tag: 'Personal', done: false, focus: false, created: Date.now() },
  { id: 3, title: 'Collect visual references', tag: 'Creative', done: true, focus: false, created: Date.now() }
];
let tasks = JSON.parse(localStorage.getItem(key)) || initialTasks;
let currentView = 'today';

const $ = (selector) => document.querySelector(selector);
const list = $('#taskList');
const emptyState = $('#emptyState');
const template = $('#taskTemplate');

function save() { localStorage.setItem(key, JSON.stringify(tasks)); }
function pluralize(count) { return `${count} task${count === 1 ? '' : 's'}`; }

function setDate() {
  const date = new Date();
  $('#weekday').textContent = date.toLocaleDateString('en-US', { weekday: 'long' });
  $('#dateNumber').textContent = date.getDate();
  $('#monthYear').textContent = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function filteredTasks() {
  if (currentView === 'completed') return tasks.filter(task => task.done);
  if (currentView === 'upcoming') return tasks.filter(task => !task.done && !task.focus);
  return tasks.filter(task => !task.done);
}

function render() {
  const visible = filteredTasks();
  list.innerHTML = '';
  visible.forEach(task => {
    const fragment = template.content.cloneNode(true);
    const item = fragment.querySelector('.task-item');
    item.dataset.id = task.id;
    item.classList.toggle('done', task.done);
    item.querySelector('.task-title').textContent = task.title;
    const tag = item.querySelector('.tag');
    tag.textContent = task.tag;
    tag.dataset.tag = task.tag;
    item.querySelector('.task-date').textContent = task.done ? 'finished' : task.focus ? 'in focus' : 'today';
    const pin = item.querySelector('.pin-button');
    pin.classList.toggle('pinned', task.focus);
    pin.setAttribute('aria-label', task.focus ? 'Remove from focus' : 'Make this your focus');
    list.appendChild(fragment);
  });
  emptyState.hidden = visible.length !== 0;
  const remaining = tasks.filter(task => !task.done).length;
  $('#taskCount').textContent = pluralize(visible.length);
  $('#listHint').textContent = currentView === 'completed' ? 'proof you showed up' : remaining ? 'keep moving gently' : 'the day is yours';
  $('#todayCount').textContent = remaining;
  $('#upcomingCount').textContent = tasks.filter(task => !task.done && !task.focus).length;
  $('#completedCount').textContent = tasks.filter(task => task.done).length;
  const total = tasks.length || 1;
  const percent = Math.round((tasks.filter(task => task.done).length / total) * 100);
  $('#momentumBar').style.width = `${percent}%`;
  $('#momentumText').textContent = `${percent}%`;
  $('#momentumMessage').textContent = percent === 100 && tasks.length ? 'A beautiful clean slate.' : percent >= 50 ? 'You are building momentum.' : 'A clear list is a clear mind.';
  renderFocus();
}

function renderFocus() {
  const focus = tasks.find(task => task.focus && !task.done) || tasks.find(task => !task.done);
  $('#focusTask').textContent = focus ? focus.title : 'Your list is beautifully clear.';
  $('#focusMeta').textContent = focus ? `${focus.tag} · Give this one your full attention.` : 'Take a breath. You finished what you set out to do.';
  $('#completeFocus').disabled = !focus;
  $('#completeFocus').dataset.id = focus?.id || '';
}

$('#taskForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = $('#taskInput');
  const title = input.value.trim();
  if (!title) return;
  tasks.unshift({ id: Date.now(), title, tag: $('#taskTag').value, done: false, focus: tasks.every(task => !task.focus || task.done), created: Date.now() });
  input.value = '';
  save(); render();
});

list.addEventListener('click', (event) => {
  const item = event.target.closest('.task-item');
  if (!item) return;
  const id = Number(item.dataset.id);
  if (event.target.closest('.check')) tasks = tasks.map(task => task.id === id ? { ...task, done: !task.done, focus: task.done ? task.focus : false } : task);
  if (event.target.closest('.pin-button')) tasks = tasks.map(task => ({ ...task, focus: task.id === id ? !task.focus : false }));
  if (event.target.closest('.delete-button')) tasks = tasks.filter(task => task.id !== id);
  save(); render();
});

$('#completeFocus').addEventListener('click', () => {
  const id = Number($('#completeFocus').dataset.id);
  if (!id) return;
  tasks = tasks.map(task => task.id === id ? { ...task, done: true, focus: false } : task);
  save(); render();
});

document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => {
  currentView = button.dataset.filter;
  document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item === button));
  $('#viewTitle').textContent = currentView === 'today' ? 'Today’s focus' : currentView === 'upcoming' ? 'Ready when you are' : 'Small wins, collected';
  render();
}));

$('#clearCompleted').addEventListener('click', () => { tasks = tasks.filter(task => !task.done); save(); render(); });
$('#themeToggle').addEventListener('click', () => { document.body.classList.toggle('dark'); $('#themeToggle').textContent = document.body.classList.contains('dark') ? '☀' : '☾'; });

setDate();
render();
