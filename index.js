var express = require('express');
var app = express();
var path = require('path');
var fs = require('fs');
var csv = require('csv');
var ejs = require('ejs');
var multer = require('multer');
var bodyParser = require('body-parser');
var child_process = require('child_process');
var uuid1 = require('uuid/v1');
var upload = multer({dest:path.join(__dirname, 'temp')});

var PROJECT_DIR = process.argv[2]; 
app.set('view engine', 'ejs');
app.use('/static', express.static(__dirname + '/static/'));
app.use(express.json());

app.get('/', function(req, res) {
    res.render('index');
});

app.use('/finished', express.static(__dirname + '/finished/'));

app.get('/edit/:project', function(req, res, next) {
    var filename = req.params.project;
    if (filename[filename.length-4] == '.') {
        var dirname = filename.slice(0,-4);
        console.log(path.join(__dirname, 'test', dirname));
        if (fs.existsSync(path.join(__dirname, 'test', dirname))) {
            console.log('filename is a directory that already exists');
            res.render('edit', {project:dirname});
        } else {
            console.log('file is on server, but needs to be user submitted');
            res.render('index');
        }
    } else {
        console.log('open temp directory specified');
        res.render('edit', {project:filename});
    }

});

app.delete('/:project', function(req, res) {
    fs.rmdir(path.join(PROJECT_DIR, req.params.project), function(err) {
        res.send('success');
    });
});

app.get('/edit/:project/pages', function(req, res) {
    var project = req.params.project;
    fs.readdir(path.join(PROJECT_DIR, project, 'pages'), function(err, pages) {
        if(err) {
            console.log(err);
        } else {
            res.set('Content-Type', 'application/json').send(JSON.stringify(pages));
        }
    });
});

app.get('/edit/:project/pages/:page', function(req, res) {
    var project = req.params.project;
    var page = req.params.page;
    fs.createReadStream(path.join(PROJECT_DIR, project, 'pages', page) + '.jpg').pipe(res);
});

app.get('/edit/:project/boxes', function(req, res) {
    var project = req.params.project;
    fs.readFile(path.join(PROJECT_DIR, project, 'data.json'), 'utf8', function(err, data) {
        if(err) {
            console.log(err);
        } else {
            console.log(data);
            res.set('Content-Type', 'application/json').send(data);
        }
        
    });
});
app.post('/edit/:project/boxes', function(req, res) {
    var project = req.params.project;
    var boxes = req.body.boxes;
    var repeats = req.body.repeats;
    fs.writeFile(path.join(PROJECT_DIR, project, 'data.json'), JSON.stringify(req.body), function(err) {
        if(err) {
            console.log(err);
        } else {
            res.send('success');
        }
    });
});

app.post('/edit/:project/compile', function(req, res) { 
    var project = req.params.project;
    var data = req.body;
    fs.writeFile(path.join(PROJECT_DIR, project, 'data.json'), JSON.stringify(req.body), function (err) {
        if (err) {
            console.log(err);
        } else {
            var repeats = data.repeats;
            var boxes = data.boxes;
            var dalSegnos = data.dalSegnos;
            var repeatArray = [];
            for (var i in repeats) {
                for (var j in boxes) {
                    if (boxes[j].boxID == repeats[i].start) {
                        repeatArray = [];
                        while (boxes[j].boxID != repeats[i].end) {
                            repeatArray.push(boxes[j]);
                            j++;
                        }
                        //repeatArray.push(boxes[j]);
                        boxes.splice(j, 0, ...repeatArray);
                        break;
                    }
                }
            }
            csv.stringify(boxes, {header:true}, function(err, csvData) {
                if(err) {
                    console.log(err);
                    console.log(csvData);
                } else {
                    var uniqueFolder = uuid1();
                    fs.mkdirSync(path.join(__dirname, 'temp', uniqueFolder));
                    fs.writeFile(path.join(__dirname, 'temp', uniqueFolder, project+'.csv'), csvData, function(err) {
                        if(err) {
                            console.log(err);
                        } else {
			    console.log('python compile.py ' + path.join(__dirname, 'temp', uniqueFolder, project+'.csv') + ' ' + path.join(PROJECT_DIR, project, 'pages/') + ' ' + path.join(__dirname, 'temp', uniqueFolder, '/') + ' 3');
                            child_process.exec('python compile.py ' + path.join(__dirname, 'temp', uniqueFolder, project+'.csv') + ' ' + path.join(PROJECT_DIR, project, 'pages/') + ' ' + path.join(__dirname, 'temp', uniqueFolder, '/') + ' 3', function(error, stdout) {
		//	child_process.exec('pipenv run python compile.py ' + path.join(__dirname, 'temp', uniqueFolder, project+'.csv') + ' ' + path.join(PROJECT_DIR, project, 'pages/') + ' ' + path.join(__dirname, 'temp', uniqueFolder, '/') + ' 3', function(error, stdout) {
                                  if(error) {
                                      console.log(error);
                                  } else {
                                    console.log(stdout);
                                    if (!fs.existsSync(path.join(__dirname, 'finished'))) {
                                        fs.mkdirSync(path.join(__dirname, 'finished'));
                                    }
                                    fs.copyFile(path.join(__dirname, 'temp', uniqueFolder, 'pdf_out.pdf'), path.join(__dirname, 'finished', project + '.pdf'), function(err) {
                                        if(err) {
                                            console.log(err);
                                        } else {
                                            fs.unlinkSync(path.join(__dirname, 'temp', uniqueFolder, project+'.csv'));
                                            fs.unlinkSync(path.join(__dirname, 'temp', uniqueFolder, 'pdf_out.pdf'));
                                            fs.rmdirSync(path.join(__dirname, 'temp', uniqueFolder));
                                            res.send('/finished/' + project + '.pdf');
                                            console.log('Finished file copy and cleanup!');
                                        }
                                    });
                                }
                            });
                        }
                    })
                }
            });
        }
    });
});

app.get('/projects', function(req, res) {
    fs.readdir(PROJECT_DIR, function (err, items) {
        //Note: apple folders have a .DS_store in every folder
        var filteredItems = items.filter(function (item) {
            if (item !== 'original' && item !== '.DS_Store') {
                return item;
            }
        });
        filteredItems.sort();
        res.set('Content-Type', 'application/json').send(JSON.stringify(filteredItems));
    });
});

app.post('/upload', upload.single('file'), function(req,res, next) {
    console.log(req.file);
    console.log(req.file.originalname);
    var fileArray = req.file.originalname.split('.');
    fileArray.pop();
    var foldername = fileArray.join('.');
    if(!fs.existsSync(path.join(PROJECT_DIR, foldername))) {
        fs.mkdir(path.join(PROJECT_DIR, foldername), function (err) {
            if (err) {
                console.log(err);
            } else {
                fs.copyFile(req.file.path, path.join(PROJECT_DIR, foldername, req.file.originalname), function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(req.file.path);
                        console.log(path.join(PROJECT_DIR, foldername, req.file.originalname));
                        fs.unlink(req.file.path, function(err) {
                            if(err) {
                                console.log(err);
                            }
                        })
                        // TODO call split, then findBoxes
                        fs.mkdir(path.join(PROJECT_DIR, foldername, 'pages'), function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                //child_process.exec('pipenv run python split.py ' + path.join(PROJECT_DIR, foldername, req.file.originalname) + ' ' + path.join(PROJECT_DIR, foldername, 'pages'), function(error, stdout) {
				console.log('---------------splitting files-------------');
			child_process.exec('python split.py ' + path.join(PROJECT_DIR, foldername, req.file.originalname) + ' ' + path.join(PROJECT_DIR, foldername, 'pages'), function(error, stdout) {
                                    if(error) {
                                        console.log(error);
                                    } else {
                                        console.log(stdout);
					console.log('----------find lines------');
			child_process.exec('python find_lines_original.py ' + path.join(PROJECT_DIR, foldername, 'pages/') + ' ' + path.join(PROJECT_DIR, foldername), function(error, stdout) {
                                        //child_process.exec('pipenv run python find_lines_original.py ' + path.join(PROJECT_DIR, foldername, 'pages/') + ' ' + path.join(PROJECT_DIR, foldername), function(error, stdout) {
                                            if(error) {
                                                console.log(error);
                                            } else {
                                                console.log(stdout);
                                                fs.readFile(path.join(PROJECT_DIR, foldername, 'data.json'), 'utf8', function(err, data) {
                                                    if(err) {
                                                        console.log(err);
                                                    } else {
                                                        var newData = {
                                                            boxes:JSON.parse(data),
                                                            repeats:[],
                                                            dalSegnos:[]
                                                        };
                                                        fs.writeFile(path.join(PROJECT_DIR, foldername, 'data.json'), JSON.stringify(newData), function(err) {
                                                            if(err) {
                                                                console.log(err);
                                                            } else {
                                                                res.redirect('/edit/' + foldername);
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        }); 
                                    }
                                });
                            }
                        });
                        
                        
                    }
                });
            }
        });
    } else {
        //folder already exists
        res.redirect('/edit/' + foldername);
    }
});

/********************************************************************/
//uploaded image will be stored in this file
/* var destinationPath = './public/original/';
//processed files are kept here
var processedPath = './public/';
//Storage engine

const Storage = multer.diskStorage({
    //sets the destination
    destination: destinationPath,
    //sets the filename of the uploaded thing
    filename: function(req, file, callback) {
        var ext = path.extname(file.originalname)

        callback(null, Date.now() + file.originalname) 
    }
    });

var upload = multer({
    storage: Storage
}).single('myImage');
//can do .array instead of .single for array of images


// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
//child process
var pythonExecutable = "python";

//converts Uint8array to string
//https://ourcodeworld.com/articles/read/286/how-to-execute-a-python-script-and-retrieve-output-data-and-errors-in-node-js
var Uint8arrayToString = function(data){
    return String.fromCharCode.apply(null,data)
}


//EJS
// app.set('view engine', 'ejs');

//public folder that will be static
// app.use(express.static('./public'))

//finds all previous images that are in folder



app.get('/upload',function(req,res){
    res.render('upload', {
        images: filteredItems
    });

})

app.post('/upload', (req,res) => {
    //if previous file is given 
    if (req.body.fileName != undefined)
    {
        console.log(req.body.fileName);

        res.render('upload', {
        msg: '',
        images: filteredItems,
        // file: `/processed/${req.body.fileName}`
        file: `/${req.body.fileName}`
    });
    }
    else

    //if a new file is uploaded
    {
    upload(req,res, (err) => {
        //if error
        if (err)
        {
            console.log('Error alert');
        }
        else {
            if (req.file != undefined)
            {

                // var html = buildHtml(req);   
                var data = req.file.filename + " " + req.body.projectname;
  
                var UniqueProjectName = true
                for (var i = 0; i < filteredItems.length; i++){
                    if (filteredItems[i] === req.body.projectname)
                    {
                        UniqueProjectName = false
                    }
                }

                if (UniqueProjectName == false)
                {
                    var render = res.render('upload', {
                        images: filteredItems,
                        msg: 'There is a previous project with that name'
                        });
                }
                else
                {
                filteredItems.push(req.body.projectname)
                const spawn = require('child_process').spawn;   
                const scriptExecution = spawn("python", ["combine.py"]);
                // const scriptExecution = spawn("python", ["helloworld.py"]);


                scriptExecution.stdout.on('data', (data) => {
                    console.log(String.fromCharCode.apply(null,data));
                });

                scriptExecution.stdin.write(data);
                scriptExecution.stdin.end();
                scriptExecution.on('exit', function(){
                    console.log('exited')
                    var path1 = `/${data}`

                    var render = res.render('upload',
                    {
                        images: filteredItems,
                        msg: 'File successfully uploaded',
                        file: path1
                    });
                });
            }
            }
        }
    }); //end of upload
    } //end of else
});
 */
/* 
// Delete
app.get('/delete', (req, res) => {
    var render = res.render('delete', {
    images: filteredItems
    });

});

app.post('/delete', (req,res) => {

    del_path = "./public/" + req.body.fileName;
    rimraf(del_path, function () { console.log('file deleted'); });

    filteredItems = filteredItems.filter(function(item) { 
    return item !== req.body.fileName
})

    var render = res.render('delete', {
    images: filteredItems,
    msg: 'File deleted'
    });
});


app.get('/rename', (req, res) => {



    var render = res.render('rename', {
    images: filteredItems,
    msg: ""
    });

});

app.post('/rename', (req, res) =>{
    var newName = req.body.projectname;
    var oldName = req.body.fileName;

    var UniqueProjectName = true
    for (var i = 0; i < filteredItems.length; i++){
        if (filteredItems[i] === req.body.projectname)
        {
            UniqueProjectName = false
        }
    }

    if (UniqueProjectName == false)
    {
        var render = res.render('rename', {
            images: filteredItems,
            msg: 'There is a previous project with that name'
            });
    }
    else {

        oldDirectory = "./public/" + oldName + "/";
        newDirectory = "./public/" + newName + "/";
        fs.rename(oldDirectory, newDirectory, function(err) {
            if ( err ) console.log('ERROR: ' + err);
        });

        filteredItems.push(newName);
        filteredItems = filteredItems.filter(function(item) { 
            return item !== oldName
        });

        filteredItems.sort()

        var render = res.render('rename', {
            images: filteredItems,
            msg: ''
            });

    }

});


app.get('/duplicate', (req, res) => {



    var render = res.render('duplicate', {
    images: filteredItems,
    msg: ""
    });

});

app.post('/duplicate', (req, res) =>{
    console.log("post rename")
    console.log(req.body)

    var copyProject = req.body.projectname;
    var originalProject = req.body.fileName;

    var UniqueProjectName = true
    for (var i = 0; i < filteredItems.length; i++){
        if (filteredItems[i] === copyProject)
        {
            UniqueProjectName = false
        }
    }

    if (UniqueProjectName == false)
    {
        var render = res.render('duplicate', {
            images: filteredItems,
            msg: 'There is a previous project with that name'
            });
    }
    else {

        oldDirectory = "./public/" + originalProject + "/";
        newDirectory = "./public/" + copyProject + "/";

        copydir(oldDirectory, newDirectory,function(err){
              if(err){
                console.log('Error: ' + err);
              }
            });

        filteredItems.push(copyProject);
        filteredItems.sort();
        var render = res.render('duplicate', {
            images: filteredItems,
            msg: ''
            });

    }
});

 */
app.listen(8080, function() {
    console.log('app is listening on port 8080');
});
