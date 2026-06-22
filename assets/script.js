function switchModule(id) {
  document.querySelectorAll('.module-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.module === id);
  });
  document.querySelectorAll('.module-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === 'pane-' + id);
  });
  document.querySelector('.content').scrollTop = 0;
}