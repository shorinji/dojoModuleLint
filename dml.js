// Run me in node

"use strict";

var assert = require('assert'),
	fs = require('fs'),
	util = require('util'),
	parser = require('./UglifyJS/uglify-js').parser;

if(process.argv.length < 3) {
	console.error("Usage: %s filename.js", "dml");
	process.exit();
}

var filename = process.argv[2],
	fileContents;

try {
	fileContents = fs.readFileSync(filename, "utf8");
} catch(e) {
	console.error("ERROR: %s", e);
	process.exit();
}

//console.log( fileContents );
/*
var nextToken = parser.tokenizer(fileContents),
	t = nextToken(),
	start = t.pos,
	end = t.endpos;

while(start < end) {

	console.log( util.inspect( t , true, null, true));

	t = nextToken();
	start = t.pos;
	end = t.endpos;
}
process.exit();
*/



try {
	var tree = parser.parse( fileContents );
} catch(e) {
	console.error("PARSE ERROR: %s", e);
	process.exit();
}

// display full abstract syntax tree
//console.log( util.inspect(tree, true, null, true) );


function isCallWithName(subtree, name) {

	return (subtree[0] == 'stat' &&
		subtree[1][0] == 'call' &&
		subtree[1][1][1] == name);
}

function hasDefine(tree) {
	var firstStatement = tree[1][0];
	return isCallWithName(firstStatement, 'define');
}

var toplevel = tree[1];
try{

assert(tree[1].length > 0, "Empty file");
assert( hasDefine(tree), "First statement must be define");
assert(tree[1].length < 2, "Only one top-level statement (define)"); // code-convention
var defineCall = tree[1][0][1][2];

assert.equal(defineCall.length, 2, "define requires 2 arguments"); // code-convention

var defineDependencies = defineCall[0],
	defineCallback = defineCall[1],
	defineCallbackArgs = defineCallback[2];

assert.equal(defineDependencies[0], 'array', 'First argument to define() must be array'); // code-convention
assert.equal(defineCallback[0], 'function', 'Second argument to define must be function definition'); // code-convention

var numDependencies = defineDependencies[1].length;
var numCallbackArgs = defineCallbackArgs.length;

assert.equal(numDependencies, numCallbackArgs, "Number of dependencies does not match number of callback arguments!");

//console.log("\nXXX: %s ",  util.inspect(defineDependencies, true, null, true) );

defineDependencies[1].forEach(function(dep) {
	// do some testing per dependency module or add the for later use
});

//assert.equal(defineDependencies[1][0][0], 'string', 'Dependencies must be string'); // code-convention

//console.log("\nXXX2: %s ",  util.inspect(define[0], true, null, true) );

} catch(e) {
	console.warn("Failure: %s", e);
	process.exit();
}

console.log("Found nothing obvious wrong with your file");
