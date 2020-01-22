function run_all_formats(evt) {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        var files = evt.target.files; // FileList object
        for (let f of files) {
            let fname = f.name;
            var reader = new FileReader();
            reader.onload = (function(theFile) {
                return function(e) {
                    var data = split_b_k_whatsapp(e.target.result);
                    if (data.length == 0) {
                        console.log('ERROR: bad format: ' + fname + ', ' + e.target.result);
                    } else {
                        for (let d of data.data) {
                            if (!d.date) {
                                console.log('ERROR: bad date' + fname);
                            }
                        }
                    }
                };
            })(f);
            reader.readAsText(f);
        }
        console.log('Got to end');
    }
}
