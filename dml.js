#!/usr/bin/env node
// Run me in node

(function() {
    "use strict";

    var pathToAcorn = '..';

    var assert = require('assert'),
        fs = require('fs'),
        util = require('util'),
        parser = require(pathToAcorn + '/acorn');


    // start of global function definitions
    function log(key, val, depth) {
        if(!depth) {
            depth = null;
        }
        console.log("\n%s%s",  (key ? (key + ': ') : '') , util.inspect(val, true, depth, true) );
    }

    function assertDefineCall(stmt, str) {

        assert(stmt.type == 'ExpressionStatement', str);
        assert(stmt.expression.type == 'CallExpression', str);
        assert(stmt.expression.callee.name == 'define', str);
    }

    function isStyleExpression(node) {
        return (
            node.type == 'BinaryExpression' &&
            node.operator == '+' &&
            node.left.left.value.indexOf('css') >= 0);
    }

    function die(x) {
        if(x) {
            log("", x, 1);
        }
        process.exit();
    }
    // end of global functions


    if(process.argv.length < 3) {
        console.error("Usage: %s filename.js", "dml");
        process.exit();
    }
    var filename = process.argv[2];

    var fileContents;
    try {
        fileContents = fs.readFileSync(filename, "utf8");
    } catch(e) {
        console.error("ERROR: %s", e);
        process.exit();
    }

    var tree;
    try {
        tree = parser.parse( fileContents );
    } catch(e) {
        console.error("PARSE ERROR: '%s' [line:%s pos:%s col:%s]\n\nTry running jslint/jshint on the file!", e.message, e.line, e.pos, e.col);
        process.exit();
    }

    // display full abstract syntax tree
    //console.log( util.inspect(tree, true, null, true) );


    try {

        assert(tree.end > 0, "Empty file");
        
        var firstStatement = tree.body[0];

        assertDefineCall(firstStatement, "First statement must be define");
        assert(tree.body.length < 2, "Only one top-level statement (define)"); // code-convention


        var defineCall = firstStatement.expression,
            defineArgs = defineCall['arguments'];

        assert.equal(defineArgs.length, 2, "define requires 2 arguments"); // code-convention

        var defineDependencies = defineArgs[0],
            defineCallback = defineArgs[1],
            defineCallbackArgs = defineArgs[1].params;

        assert.equal(defineDependencies.type, 'ArrayExpression', 'First argument to define() must be array'); // code-convention
        assert.equal(defineCallback.type, 'FunctionExpression', 'Second argument to define must be function definition'); // code-convention

        var numDependencies = defineDependencies.elements.length;
        var numCallbackArgs = defineCallbackArgs.length;

        var needToCheckLast = true;

        // check for and remove "dom/ready!" from count and same for css
        while( needToCheckLast  ) {
            var dep = defineDependencies.elements[ numDependencies - 1];
            if( dep.type == 'Literal' && dep.value == 'dojo/domReady!') {
                numDependencies--;
                continue;
            }

            // check for our concatenated (skinned) css files
            if( isStyleExpression(dep) ) {
                numDependencies--;
                continue;
            }
            needToCheckLast = false;
        }

        assert.equal(numDependencies, numCallbackArgs, "Number of module dependencies does not match number of callback arguments! [" + numDependencies + " != " + numCallbackArgs + "]");

    } catch(e) {
        console.warn("Failure: %s", e);
        process.exit();
    }

    console.log("Found nothing obviously wrong with your file");

}) ();