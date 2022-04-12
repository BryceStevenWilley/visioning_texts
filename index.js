// import { handleFileSelect, refreshShow, triggerProcess, string2IntArray, xDayAvg, daySelect } from './src/graphs.js'

document.getElementById('show-button').onclick = () => triggerProcess(window.file_to_read)
document.getElementById('file-select').addEventListener('change', handleFileSelect, false)
document.getElementById('day-select-all').onclick = () => daySelect(-1)
for (const [idx, day] of ['sun', 'mon', 'tues', 'wed', 'thur', 'fri', 'sat'].entries()) {
  document.getElementById('day-select-' + day).onclick = () => daySelect(idx)
}

document.getElementById('address-input').oninput = function () {
  window.address_in = parseInt(document.getElementById('thread-input').value, 10)
  refreshShow()
}

document.getElementById('k-ids-input').oninput = function () {
  window.k_ids = string2IntArray(document.getElementById('k_ids_input').value)
  refreshShow()
}

document.getElementById('b-ids-input').oninput = function () {
  window.b_ids = string2IntArray(document.getElementById('b-ids-input').value)
  refreshShow()
}

document.getElementById('b-name-input').oninput = function () {
  window.b_name = document.getElementById('b-name-input').value
  refreshShow()
}

document.getElementById('k-name-input').oninput = function () {
  window.k_name = document.getElementById('k-name-input').value
  refreshShow()
}

document.getElementById('graph2-x-day-avg').oninput = function () {
  xDayAvg(document.getElementById('graph2-x-day-avg').value)
}
