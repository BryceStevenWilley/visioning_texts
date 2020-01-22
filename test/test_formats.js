function run_all_formats(evt) {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        var files = evt.target.files; // FileList object
        for (var f of files) {
            var reader = new FileReader();
            reader.onload = (function(theFile) {
                return function(e) {
                    var data = split_b_k_whatsapp(e.target.result);
                    if (data.length == 0) {
                        console.log('ERROR: ' + f.name + ', ' + e.target.result);
                    } else {
                        console.log('all good' + f.name);
                    }
                };
            })(f);
            reader.readAsText(f);
        }
    }
}
