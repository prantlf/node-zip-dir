/* global describe, it, beforeEach, afterEach */
/* eslint-disable no-unused-expressions */

var Zip = require('jszip')
var unzip = require('unzip')
var zipDir = require('../index')
var path = require('path')
var fs = require('fs-extra')
var bufferEqual = require('buffer-equal')
var chai = require('chai')
var expect = chai.expect

var sampleZipPath = path.join(__dirname, 'fixtures/sampleZip')
var xpiPath = path.join(__dirname, 'my.xpi')
var outputPath = path.join(__dirname, 'myxpi/')
var emptyDirPath = path.join(sampleZipPath, 'emptyDir')
var emptyDirOutputPath = path.join(outputPath, 'emptyDir')

describe('zip-dir', function () {
  describe('creates a zip buffer', function () {
    it('returns a usable zip buffer', function (done) {
      zipDir(sampleZipPath, function (err, buffer) {
        expect(err).to.not.be.ok
        var zip = new Zip()
        zip.loadAsync(buffer).then(function () { done() })
      })
    })

    it('works with a trailing `/` in the path', function (done) {
      zipDir(path.join(sampleZipPath, path.sep), function (err, buffer) {
        expect(err).to.not.be.ok
        var zip = new Zip()
        zip.loadAsync(buffer).then(function () { done() })
      })
    })

    it('returns an error when dirPath doesn"t exist', function (done) {
      zipDir(xpiPath, function (err, buffer) {
        expect(err).to.be.ok
        expect(buffer).to.not.be.ok
        done()
      })
    })

    it('returns an error when dirPath is a file', function (done) {
      zipDir(path.join(sampleZipPath, 'file1.json'), function (err, buffer) {
        expect(err).to.be.ok
        expect(buffer).to.not.be.ok
        done()
      })
    })
  })

  describe('writes a zip file', function () {
    beforeEach(function (done) {
      addEmpty(function () {
        zipAndUnzip({ saveTo: xpiPath }, done)
      })
    })
    afterEach(cleanUp)

    it('compresses and unpacks and all files match', function (done) {
      var files = [
        'file1.json',
        'tiny.gif',
        'dir/file2.json',
        'dir/file3.json',
        'dir/deepDir/deeperDir/file4.json'
      ]
      files.forEach(compareFiles.bind(null, '.'))
      done()
    })

    it('retains empty directories', function (done) {
      fs.stat(emptyDirOutputPath, function (err, stat) {
        expect(err).to.not.be.ok
        expect(stat.isDirectory()).to.be.ok
        done()
      })
    })
  })

  describe('if a root path is specified', function () {
    afterEach(cleanUp)

    it('stores input files and folders below the root path', function (done) {
      zipAndUnzip({ saveTo: xpiPath, rootPath: 'first/second' }, function () {
        var files = [
          'file1.json',
          'tiny.gif',
          'dir/file2.json',
          'dir/file3.json',
          'dir/deepDir/deeperDir/file4.json'
        ]
        files.forEach(compareFiles.bind(null, 'first/second'))
        done()
      })
    })
  })

  describe('uses `filter` to select items', function () {
    afterEach(cleanUp)

    it('filters out by file name, fs.Stat', function (done) {
      zipAndUnzip({ saveTo: xpiPath, filter: jsonOnly }, function () {
        var files = [
          'file1.json',
          'dir/file2.json',
          'dir/file3.json',
          'dir/deepDir/deeperDir/file4.json'
        ]
        files.forEach(compareFiles.bind(null, '.'))

        fs.stat(path.join(outputPath, 'tiny.gif'), function (err, stat) {
          expect(err).to.be.ok
          done()
        })
      })

      function jsonOnly (name, stat) {
        return /\.json$/.test(name) || stat.isDirectory()
      }
    })

    it('filtering out directories keeps it shallow', function (done) {
      zipAndUnzip({ saveTo: xpiPath, filter: noDirs }, function () {
        var files = [
          'file1.json',
          'tiny.gif'
        ]
        files.forEach(compareFiles.bind(null, '.'))

        fs.stat(path.join(outputPath, 'dir'), function (err, stat) {
          expect(err).to.be.ok
          done()
        })
      })

      function noDirs (name, stat) {
        return !stat.isDirectory()
      }
    })
  })

  describe('`each` option', function () {
    afterEach(cleanUp)

    it('calls `each` with each path added to zip', function (done) {
      var paths = []
      function each (p) {
        paths.push(p)
      }
      zipDir(sampleZipPath, { each: each }, function () {
        var files = [
          'file1.json',
          'tiny.gif',
          'dir/',
          'dir/file2.json',
          'dir/file3.json',
          'dir/deepDir',
          'dir/deepDir/deeperDir',
          'dir/deepDir/deeperDir/file4.json'
        ].map(function (p) { return path.join.apply(path, [sampleZipPath].concat(p.split('/'))) })

        files.forEach(function (p) {
          expect(paths.indexOf(p)).to.not.equal(-1)
          return p
        })

        expect(paths.length).to.be.equal(files.length)
        done()
      })
    })

    it('calls `each`, ignoring unadded files', function (done) {
      var paths = []
      function each (p) { paths.push(p) }
      function filter (p) { return /\.json$/.test(p) || fs.statSync(p).isDirectory() }
      zipDir(sampleZipPath, { each: each, filter: filter }, function () {
        var files = [
          'file1.json',
          'dir/file2.json',
          'dir/file3.json',
          'dir/',
          'dir/deepDir',
          'dir/deepDir/deeperDir',
          'dir/deepDir/deeperDir/file4.json'
        ].map(function (p) { return path.join.apply(path, [sampleZipPath].concat(p.split('/'))) })

        files.forEach(function (p) {
          expect(paths.indexOf(p)).to.not.equal(-1)
          return p
        })

        expect(paths.length).to.be.equal(files.length)
        done()
      })
    })
  })

  describe('if empty directories should be omitted', function () {
    afterEach(cleanUp)

    it('empty root directory is not allowed by default', function (done) {
      zipDir(sampleZipPath, {
        filter: nothing, omitEmptyDirs: true
      }, function (err) {
        expect(err).to.be.ok
        done()
      })
    })

    it('empty root directory can be allowed', function (done) {
      zipDir(sampleZipPath, {
        saveTo: xpiPath,
        filter: nothing,
        omitEmptyDirs: true,
        allowEmptyRoot: true
      }, function () {
        fs.stat(xpiPath, function (err, stat) {
          expect(err).to.not.be.ok
          expect(stat.size).to.equal(22)
          done()
        })
      })
    })

    it('empty nested directory will be omitted', function (done) {
      zipAndUnzip({
        saveTo: xpiPath, filter: belowDir, omitEmptyDirs: true
      }, function () {
        var files = [
          'file1.json',
          'tiny.gif'
        ]
        files.forEach(compareFiles.bind(null, '.'))

        fs.stat(path.join(outputPath, 'dir'), function (err, stat) {
          expect(err).to.be.ok
          done()
        })
      })

      function belowDir (name) {
        return !/\/dir\//.test(name)
      }
    })

    function nothing () {
      return false
    }
  })
})

function compareFiles (rootPath, file) {
  var zipBuffer = fs.readFileSync(path.join(sampleZipPath, file))
  var fileBuffer = fs.readFileSync(path.join(outputPath, rootPath, file))
  expect(bufferEqual(zipBuffer, fileBuffer)).to.be.ok
}

function zipAndUnzip (options, done) {
  zipDir(sampleZipPath, options, function (err) {
    if (err) throw err
    fs.createReadStream(xpiPath)
      .pipe(unzip.Extract({ path: outputPath }))
      .on('close', done)
  })
}

function cleanUp (done) {
  fs.remove(outputPath, function () {
    fs.remove(xpiPath, function () {
      fs.remove(emptyDirPath, done)
    })
  })
}

// Adds an empty directory for testing
function addEmpty (done) {
  fs.mkdirp(emptyDirPath, done)
}
