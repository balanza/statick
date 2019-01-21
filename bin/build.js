#!/usr/bin/env

const fs = require('fs'),
    path = require('path'),
    rimraf = require('rimraf'),
    Handlebars = require('handlebars'),
    less = require('less'),
    ncp = require('ncp').ncp

const baseDir = '.',
    distDir = `${baseDir}/dist`,
    tplDir = `${baseDir}/templates`,
    assetsDir = `${baseDir}/assets`,
    lessDir = `${baseDir}/less`

async function compile() {
    await clean()
    await ensureDirectory(distDir)
    await compileCSS()
    await compileHTML()
    await compileAssets()
}

function clean() {
    return new Promise((ok, ko) => {
        rimraf(distDir, (err) => err ? ko() : ok())
    })
}


function ensureDirectory(dir) {
    var existsSync = fs.existsSync || path.existsSync;
    if (!existsSync(dir)) {
        fs.mkdirSync(dir);
    }
};

async function compileCSS() {
    const sourceDir = lessDir,
        outputDir = `${distDir}/css`,
        sourceFile = 'style.less'

    ensureDirectory(outputDir)

    // Load the file, convert to string
    const data = fs.readFileSync(`${sourceDir}/${sourceFile}`, 'utf-8')
    var dataString = data.toString();
    var options = {
        paths: [sourceDir], // .less file search paths
        outputDir, // output directory, note the '/'
        optimization: 1, // optimization level, higher is better but more volatile - 1 is a good value
        filename: sourceFile, // root .less file
        compress: true, // compress?
        yuicompress: true // use YUI compressor?
    };


    // Create a file name such that
    //  if options.filename == gaf.js and options.compress = true
    //    outputfile = gaf.min.css
    options.outputfile = options.filename.split(".less")[0] + (options.compress ? ".min" : "") + ".css";
    // Resolves the relative output.dir to an absolute one and ensure the directory exist
    options.outputDir = path.resolve(process.cwd(), options.outputDir) + "/";
    ensureDirectory(options.outputDir);

    less.render(dataString, options, function (error, cssTree) {
        if (error) {
            less.writeError(error, options);
            return;
        }
        // Create the CSS from the cssTree
        var cssString = cssTree.css

        // Write output
        fs.writeFileSync(options.outputDir + options.outputfile, cssString, 'utf8');

    });

}

function compileHTML() {

    ['index'].map(e => ({
            source: fs.readFileSync(`${tplDir}/index.html`, 'utf-8'),
            data: require(`../data/${e}.json`),
            output: `${distDir}/${e}.html`
        }))
        .map(({
                source,
                data,
                output
            }) =>
            fs.writeFileSync(output, Handlebars.compile(source)(data))
        )
}

function compileAssets() {
    const source = assetsDir,
        destination = `${distDir}`
    return new Promise((ok, ko) => {
        ncp(source, destination, function (err) {
            if (err) ko()
            else ok()
        })
    })

}

compile()