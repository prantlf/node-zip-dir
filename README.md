# @prantlf/zip-dir
[![NPM version](https://badge.fury.io/js/%40prantlf%2Fzip-dir.png)](http://badge.fury.io/js/%40prantlf%2Fzip-dir)
[![Build Status](https://travis-ci.org/prantlf/node-zip-dir.png)](https://travis-ci.org/prantlf/node-zip-dir)
[![codecov](https://codecov.io/gh/prantlf/node-zip-dir/branch/master/graph/badge.svg)](https://codecov.io/gh/prantlf/node-zip-dir)
[![Dependency Status](https://david-dm.org/prantlf/node-zip-dir.svg)](https://david-dm.org/prantlf/node-zip-dir)
[![devDependency Status](https://david-dm.org/prantlf/node-zip-dir/dev-status.svg)](https://david-dm.org/prantlf/node-zip-dir#info=devDependencies)

Zips up a directory and saves the zip archive to disk or returns as a buffer.

This fork enhances the original project with the following functionality:

* Depends on the most recent versions of [`jszip`] and other packages.
* Supports both callback and [`Promise`] to notify about the finished work.
* Offers extra parameters `rootPath`, `comment`, `compressionLevel`, `omitEmptyDirs` and `allowEmptyRoot`.

## install

```
$ npm install @prantlf/zip-dir
```

## example

```javascript
var zipdir = require('@prantlf/zip-dir');

// `buffer` is the buffer of the zipped file
var buffer = await zipdir('/path/to/be/zipped');

zipdir('/path/to/be/zipped', function (err, buffer) {
  // `buffer` is the buffer of the zipped file
});

zipdir('/path/to/be/zipped', { rootPath: 'archived' }, function (err, buffer) {
  // Files and folders from `/path/to/be/zipped will`
  // be stored in `archived/` in the output zip file.
});

zipdir('/path/to/be/zipped', { saveTo: '~/myzip.zip' }, function (err, buffer) {
  // `buffer` is the buffer of the zipped file
  // And the buffer was saved to `~/myzip.zip`
});

// Use a filter option to prevent zipping other zip files!
// Keep in mind you have to allow a directory to descend into!
zipdir('/path/to/be/zipped', { filter: (path, stat) => !/\.zip$/.test(path) }, function (err, buffer) {
  
});

// Use an `each` option to call a function everytime a file is added, and receives the path
zipdir('/path/to/be/zipped', { each: path => console.log(p, "added!"), function (err, buffer) {

});
  
```

## methods

```
var zipdir = require('@prantlf/zip-dir');
```

### zipdir(dirPath, [options], [callback]) : [Promise]

Zips up `dirPath` recursively preserving directory structure and returns
the compressed buffer on success. If the `callback` function is supplied, it will be called with `(error, buffer)` once the `zipdir` function is done. If not, the buffer or an error can be obtained from the returned promise. The `callback` and the promise are mutually exclusive. If `options` defined with a `saveTo` path, then the callback and promise will be delayed until the buffer has also
been saved to disk.

#### Options

* `rootPath` Folder path to create in the root of the zip file and place the input files and folder below it. Input files and folders will be placed directly to the zip file root by default.
* `saveTo` A path to save the buffer to.
* `filter` A function that is called for all items to determine whether or not they should be added to the zip buffer. Function is called with the `fullPath` and a `stats` object ([fs.Stats]). Return true to add the item; false otherwise. To include files within directories, directories must also pass this filter.
* `each` A function that is called everytime a file or directory is added to the zip.
* `comment` A comment to be stored to the zip file.
* `compressionLevel` The level of compression to use. A number from 1 (best speed) and 9 (best compression). 6 is the default.
* `omitEmptyDirs` Prevents empty directories from being included in the zip file. If the root folder to pack is empty, the whole operation will fail.
* `allowEmptyRoot` Lets the empty root directory be included in the zip file, if the`omitEmptyDirs` is set to `true`.

## license

MIT

[`jszip`]: https://www.npmjs.com/package/jszip
[`Promise`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[fs.Stats]: http://nodejs.org/api/fs.html#fs_class_fs_stats
