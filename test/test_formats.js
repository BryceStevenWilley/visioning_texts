import { splitBKWhatsapp } from '../src/math.js'

function runAllFormats (evt) {
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    const files = evt.target.files // FileList object
    for (const f of files) {
      const fname = f.name
      const reader = new FileReader()
      reader.onload = (function (theFile) {
        return function (e) {
          const data = splitBKWhatsapp(e.target.result)
          if (data.length === 0) {
            console.log('ERROR: bad format: ' + fname + ', ' + e.target.result)
          } else {
            for (const d of data.data) {
              if (!d.date) {
                console.log('ERROR: bad date' + fname)
              }
            }
          }
        }
      })(f)
      reader.readAsText(f)
    }
    console.log('Got to end')
  }
}

document.getElementById('file-select').addEventListener('change', runAllFormats, false);