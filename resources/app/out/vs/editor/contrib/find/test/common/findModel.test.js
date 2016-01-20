/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'assert', 'vs/editor/contrib/find/common/findModel', 'vs/editor/common/editorCommon', 'vs/editor/test/common/mocks/mockCodeEditor', 'vs/editor/contrib/find/common/findState', 'vs/editor/common/core/range', 'vs/editor/common/core/position'], function (require, exports, assert, findModel_1, EditorCommon, mockCodeEditor_1, findState_1, range_1, position_1) {
    suite('FindModel', function () {
        test('parseFindWidgetString', function () {
            var testParse = function (input, expected) {
                var actual = findModel_1.parseReplaceString(input);
                assert.equal(actual, expected);
                var actual2 = findModel_1.parseReplaceString('hello' + input + 'hi');
                assert.equal(actual2, 'hello' + expected + 'hi');
            };
            // no backslash => no treatment
            testParse('hello', 'hello');
            // \t => TAB
            testParse('\\thello', '\thello');
            // \n => LF
            testParse('\\nhello', '\nhello');
            // \\t => \t
            testParse('\\\\thello', '\\thello');
            // \\\t => \TAB
            testParse('\\\\\\thello', '\\\thello');
            // \\\\t => \\t
            testParse('\\\\\\\\thello', '\\\\thello');
            // \ at the end => no treatment
            testParse('hello\\', 'hello\\');
            // \ with unknown char => no treatment
            testParse('hello\\x', 'hello\\x');
            // \ with back reference => no treatment
            testParse('hello\\0', 'hello\\0');
        });
        function findTest(testName, callback) {
            test(testName, function () {
                mockCodeEditor_1.withMockCodeEditor([
                    '// my cool header',
                    '#include "cool.h"',
                    '#include <iostream>',
                    '',
                    'int main() {',
                    '    cout << "hello world, Hello!" << endl;',
                    '    cout << "hello world again" << endl;',
                    '    cout << "Hello world again" << endl;',
                    '    cout << "helloworld again" << endl;',
                    '}',
                    '// blablablaciao',
                    ''
                ], {}, callback);
            });
        }
        function fromRange(rng) {
            return [rng.startLineNumber, rng.startColumn, rng.endLineNumber, rng.endColumn];
        }
        function _getFindState(editor) {
            var model = editor.getModel();
            var currentFindMatches = [];
            var allFindMatches = [];
            for (var _i = 0, _a = model.getAllDecorations(); _i < _a.length; _i++) {
                var dec = _a[_i];
                if (dec.options.className === 'currentFindMatch') {
                    currentFindMatches.push(dec.range);
                    allFindMatches.push(dec.range);
                }
                else if (dec.options.className === 'findMatch') {
                    allFindMatches.push(dec.range);
                }
            }
            currentFindMatches.sort(range_1.Range.compareRangesUsingStarts);
            allFindMatches.sort(range_1.Range.compareRangesUsingStarts);
            return {
                highlighted: currentFindMatches.map(fromRange),
                findDecorations: allFindMatches.map(fromRange)
            };
        }
        function assertFindState(editor, cursor, highlighted, findDecorations) {
            assert.deepEqual(fromRange(editor.getSelection()), cursor, 'cursor');
            var expectedState = {
                highlighted: highlighted ? [highlighted] : [],
                findDecorations: findDecorations
            };
            assert.deepEqual(_getFindState(editor), expectedState, 'state');
        }
        findTest('incremental find from beginning of file', function (editor, cursor) {
            editor.setPosition({ lineNumber: 1, column: 1 });
            var findState = new findState_1.FindReplaceState();
            var findModel = new findModel_1.FindModelBoundToEditorModel(editor, findState);
            // simulate typing the search string
            findState.change({ searchString: 'H' }, true);
            assertFindState(editor, [1, 12, 1, 13], [1, 12, 1, 13], [
                [1, 12, 1, 13],
                [2, 16, 2, 17],
                [6, 14, 6, 15],
                [6, 27, 6, 28],
                [7, 14, 7, 15],
                [8, 14, 8, 15],
                [9, 14, 9, 15]
            ]);
            // simulate typing the search string
            findState.change({ searchString: 'He' }, true);
            assertFindState(editor, [1, 12, 1, 14], [1, 12, 1, 14], [
                [1, 12, 1, 14],
                [6, 14, 6, 16],
                [6, 27, 6, 29],
                [7, 14, 7, 16],
                [8, 14, 8, 16],
                [9, 14, 9, 16]
            ]);
            // simulate typing the search string
            findState.change({ searchString: 'Hello' }, true);
            assertFindState(editor, [6, 14, 6, 19], [6, 14, 6, 19], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19],
                [9, 14, 9, 19]
            ]);
            // simulate toggling on `matchCase`
            findState.change({ matchCase: true }, true);
            assertFindState(editor, [6, 27, 6, 32], [6, 27, 6, 32], [
                [6, 27, 6, 32],
                [8, 14, 8, 19]
            ]);
            // simulate typing the search string
            findState.change({ searchString: 'hello' }, true);
            assertFindState(editor, [6, 14, 6, 19], [6, 14, 6, 19], [
                [6, 14, 6, 19],
                [7, 14, 7, 19],
                [9, 14, 9, 19]
            ]);
            // simulate toggling on `wholeWord`
            findState.change({ wholeWord: true }, true);
            assertFindState(editor, [6, 14, 6, 19], [6, 14, 6, 19], [
                [6, 14, 6, 19],
                [7, 14, 7, 19]
            ]);
            // simulate toggling off `matchCase`
            findState.change({ matchCase: false }, true);
            assertFindState(editor, [6, 14, 6, 19], [6, 14, 6, 19], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            // simulate toggling off `wholeWord`
            findState.change({ wholeWord: false }, true);
            assertFindState(editor, [6, 14, 6, 19], [6, 14, 6, 19], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19],
                [9, 14, 9, 19]
            ]);
            // simulate adding a search scope
            findState.change({ searchScope: new range_1.Range(8, 1, 10, 1) }, true);
            assertFindState(editor, [8, 14, 8, 19], [8, 14, 8, 19], [
                [8, 14, 8, 19],
                [9, 14, 9, 19]
            ]);
            // simulate removing the search scope
            findState.change({ searchScope: null }, true);
            assertFindState(editor, [6, 14, 6, 19], [6, 14, 6, 19], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19],
                [9, 14, 9, 19]
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find model removes its decorations', function (editor, cursor) {
            var findState = new findState_1.FindReplaceState();
            findState.change({ searchString: 'hello' }, false);
            var findModel = new findModel_1.FindModelBoundToEditorModel(editor, findState);
            assert.equal(findState.matchesCount, 5);
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19],
                [9, 14, 9, 19]
            ]);
            findModel.dispose();
            findState.dispose();
            assertFindState(editor, [1, 1, 1, 1], null, []);
        });
        findTest('find model updates state matchesCount', function (editor, cursor) {
            var findState = new findState_1.FindReplaceState();
            findState.change({ searchString: 'hello' }, false);
            var findModel = new findModel_1.FindModelBoundToEditorModel(editor, findState);
            assert.equal(findState.matchesCount, 5);
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19],
                [9, 14, 9, 19]
            ]);
            findState.change({ searchString: 'helloo' }, false);
            assert.equal(findState.matchesCount, 0);
            assertFindState(editor, [1, 1, 1, 1], null, []);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find model reacts to position change', function (editor, cursor) {
            var findState = new findState_1.FindReplaceState();
            findState.change({ searchString: 'hello' }, false);
            var findModel = new findModel_1.FindModelBoundToEditorModel(editor, findState);
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19],
                [9, 14, 9, 19]
            ]);
            cursor.configuration.handlerDispatcher.trigger('mouse', EditorCommon.Handler.MoveTo, {
                position: new position_1.Position(6, 20)
            });
            assertFindState(editor, [6, 20, 6, 20], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19],
                [9, 14, 9, 19]
            ]);
            findState.change({ searchString: 'Hello' }, true);
            assertFindState(editor, [6, 27, 6, 32], [6, 27, 6, 32], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19],
                [9, 14, 9, 19]
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find model next', function (editor, cursor) {
            var findState = new findState_1.FindReplaceState();
            findState.change({ searchString: 'hello', wholeWord: true }, false);
            var findModel = new findModel_1.FindModelBoundToEditorModel(editor, findState);
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [6, 14, 6, 19], [6, 14, 6, 19], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [6, 27, 6, 32], [6, 27, 6, 32], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [7, 14, 7, 19], [7, 14, 7, 19], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [8, 14, 8, 19], [8, 14, 8, 19], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [6, 14, 6, 19], [6, 14, 6, 19], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find model next stays in scope', function (editor, cursor) {
            var findState = new findState_1.FindReplaceState();
            findState.change({ searchString: 'hello', wholeWord: true, searchScope: new range_1.Range(7, 1, 9, 1) }, false);
            var findModel = new findModel_1.FindModelBoundToEditorModel(editor, findState);
            assertFindState(editor, [1, 1, 1, 1], null, [
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [7, 14, 7, 19], [7, 14, 7, 19], [
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [8, 14, 8, 19], [8, 14, 8, 19], [
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [7, 14, 7, 19], [7, 14, 7, 19], [
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find model prev', function (editor, cursor) {
            var findState = new findState_1.FindReplaceState();
            findState.change({ searchString: 'hello', wholeWord: true }, false);
            var findModel = new findModel_1.FindModelBoundToEditorModel(editor, findState);
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToPrevMatch();
            assertFindState(editor, [8, 14, 8, 19], [8, 14, 8, 19], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToPrevMatch();
            assertFindState(editor, [7, 14, 7, 19], [7, 14, 7, 19], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToPrevMatch();
            assertFindState(editor, [6, 27, 6, 32], [6, 27, 6, 32], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToPrevMatch();
            assertFindState(editor, [6, 14, 6, 19], [6, 14, 6, 19], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToPrevMatch();
            assertFindState(editor, [8, 14, 8, 19], [8, 14, 8, 19], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find model prev stays in scope', function (editor, cursor) {
            var findState = new findState_1.FindReplaceState();
            findState.change({ searchString: 'hello', wholeWord: true, searchScope: new range_1.Range(7, 1, 9, 1) }, false);
            var findModel = new findModel_1.FindModelBoundToEditorModel(editor, findState);
            assertFindState(editor, [1, 1, 1, 1], null, [
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToPrevMatch();
            assertFindState(editor, [8, 14, 8, 19], [8, 14, 8, 19], [
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToPrevMatch();
            assertFindState(editor, [7, 14, 7, 19], [7, 14, 7, 19], [
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToPrevMatch();
            assertFindState(editor, [8, 14, 8, 19], [8, 14, 8, 19], [
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find model next/prev with no matches', function (editor, cursor) {
            var findState = new findState_1.FindReplaceState();
            findState.change({ searchString: 'helloo', wholeWord: true }, false);
            var findModel = new findModel_1.FindModelBoundToEditorModel(editor, findState);
            assertFindState(editor, [1, 1, 1, 1], null, []);
            findModel.moveToNextMatch();
            assertFindState(editor, [1, 1, 1, 1], null, []);
            findModel.moveToPrevMatch();
            assertFindState(editor, [1, 1, 1, 1], null, []);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find model next/prev respects cursor position', function (editor, cursor) {
            var findState = new findState_1.FindReplaceState();
            findState.change({ searchString: 'hello', wholeWord: true }, false);
            var findModel = new findModel_1.FindModelBoundToEditorModel(editor, findState);
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            cursor.configuration.handlerDispatcher.trigger('mouse', EditorCommon.Handler.MoveTo, {
                position: new position_1.Position(6, 20)
            });
            assertFindState(editor, [6, 20, 6, 20], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [6, 27, 6, 32], [6, 27, 6, 32], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find ^', function (editor, cursor) {
            var findState = new findState_1.FindReplaceState();
            findState.change({ searchString: '^', isRegex: true }, false);
            var findModel = new findModel_1.FindModelBoundToEditorModel(editor, findState);
            assertFindState(editor, [1, 1, 1, 1], null, [
                [1, 1, 1, 1],
                [2, 1, 2, 1],
                [3, 1, 3, 1],
                [4, 1, 4, 1],
                [5, 1, 5, 1],
                [6, 1, 6, 1],
                [7, 1, 7, 1],
                [8, 1, 8, 1],
                [9, 1, 9, 1],
                [10, 1, 10, 1],
                [11, 1, 11, 1],
                [12, 1, 12, 1],
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [2, 1, 2, 1], [2, 1, 2, 1], [
                [1, 1, 1, 1],
                [2, 1, 2, 1],
                [3, 1, 3, 1],
                [4, 1, 4, 1],
                [5, 1, 5, 1],
                [6, 1, 6, 1],
                [7, 1, 7, 1],
                [8, 1, 8, 1],
                [9, 1, 9, 1],
                [10, 1, 10, 1],
                [11, 1, 11, 1],
                [12, 1, 12, 1],
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [3, 1, 3, 1], [3, 1, 3, 1], [
                [1, 1, 1, 1],
                [2, 1, 2, 1],
                [3, 1, 3, 1],
                [4, 1, 4, 1],
                [5, 1, 5, 1],
                [6, 1, 6, 1],
                [7, 1, 7, 1],
                [8, 1, 8, 1],
                [9, 1, 9, 1],
                [10, 1, 10, 1],
                [11, 1, 11, 1],
                [12, 1, 12, 1],
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find $', function (editor, cursor) {
            var findState = new findState_1.FindReplaceState();
            findState.change({ searchString: '$', isRegex: true }, false);
            var findModel = new findModel_1.FindModelBoundToEditorModel(editor, findState);
            assertFindState(editor, [1, 1, 1, 1], null, [
                [1, 18, 1, 18],
                [2, 18, 2, 18],
                [3, 20, 3, 20],
                [4, 1, 4, 1],
                [5, 13, 5, 13],
                [6, 43, 6, 43],
                [7, 41, 7, 41],
                [8, 41, 8, 41],
                [9, 40, 9, 40],
                [10, 2, 10, 2],
                [11, 17, 11, 17],
                [12, 1, 12, 1],
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [1, 18, 1, 18], [1, 18, 1, 18], [
                [1, 18, 1, 18],
                [2, 18, 2, 18],
                [3, 20, 3, 20],
                [4, 1, 4, 1],
                [5, 13, 5, 13],
                [6, 43, 6, 43],
                [7, 41, 7, 41],
                [8, 41, 8, 41],
                [9, 40, 9, 40],
                [10, 2, 10, 2],
                [11, 17, 11, 17],
                [12, 1, 12, 1],
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [2, 18, 2, 18], [2, 18, 2, 18], [
                [1, 18, 1, 18],
                [2, 18, 2, 18],
                [3, 20, 3, 20],
                [4, 1, 4, 1],
                [5, 13, 5, 13],
                [6, 43, 6, 43],
                [7, 41, 7, 41],
                [8, 41, 8, 41],
                [9, 40, 9, 40],
                [10, 2, 10, 2],
                [11, 17, 11, 17],
                [12, 1, 12, 1],
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [3, 20, 3, 20], [3, 20, 3, 20], [
                [1, 18, 1, 18],
                [2, 18, 2, 18],
                [3, 20, 3, 20],
                [4, 1, 4, 1],
                [5, 13, 5, 13],
                [6, 43, 6, 43],
                [7, 41, 7, 41],
                [8, 41, 8, 41],
                [9, 40, 9, 40],
                [10, 2, 10, 2],
                [11, 17, 11, 17],
                [12, 1, 12, 1],
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find next ^$', function (editor, cursor) {
            var findState = new findState_1.FindReplaceState();
            findState.change({ searchString: '^$', isRegex: true }, false);
            var findModel = new findModel_1.FindModelBoundToEditorModel(editor, findState);
            assertFindState(editor, [1, 1, 1, 1], null, [
                [4, 1, 4, 1],
                [12, 1, 12, 1],
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [4, 1, 4, 1], [4, 1, 4, 1], [
                [4, 1, 4, 1],
                [12, 1, 12, 1],
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [12, 1, 12, 1], [12, 1, 12, 1], [
                [4, 1, 4, 1],
                [12, 1, 12, 1],
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [4, 1, 4, 1], [4, 1, 4, 1], [
                [4, 1, 4, 1],
                [12, 1, 12, 1],
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('find prev ^$', function (editor, cursor) {
            var findState = new findState_1.FindReplaceState();
            findState.change({ searchString: '^$', isRegex: true }, false);
            var findModel = new findModel_1.FindModelBoundToEditorModel(editor, findState);
            assertFindState(editor, [1, 1, 1, 1], null, [
                [4, 1, 4, 1],
                [12, 1, 12, 1],
            ]);
            findModel.moveToPrevMatch();
            assertFindState(editor, [12, 1, 12, 1], [12, 1, 12, 1], [
                [4, 1, 4, 1],
                [12, 1, 12, 1],
            ]);
            findModel.moveToPrevMatch();
            assertFindState(editor, [4, 1, 4, 1], [4, 1, 4, 1], [
                [4, 1, 4, 1],
                [12, 1, 12, 1],
            ]);
            findModel.moveToPrevMatch();
            assertFindState(editor, [12, 1, 12, 1], [12, 1, 12, 1], [
                [4, 1, 4, 1],
                [12, 1, 12, 1],
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('replace hello', function (editor, cursor) {
            var findState = new findState_1.FindReplaceState();
            findState.change({ searchString: 'hello', replaceString: 'hi', wholeWord: true }, false);
            var findModel = new findModel_1.FindModelBoundToEditorModel(editor, findState);
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            cursor.configuration.handlerDispatcher.trigger('mouse', EditorCommon.Handler.MoveTo, {
                position: new position_1.Position(6, 20)
            });
            assertFindState(editor, [6, 20, 6, 20], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            assert.equal(editor.getModel().getLineContent(6), '    cout << "hello world, Hello!" << endl;');
            findModel.replace();
            assertFindState(editor, [6, 27, 6, 32], [6, 27, 6, 32], [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            assert.equal(editor.getModel().getLineContent(6), '    cout << "hello world, Hello!" << endl;');
            findModel.replace();
            assertFindState(editor, [7, 14, 7, 19], [7, 14, 7, 19], [
                [6, 14, 6, 19],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            assert.equal(editor.getModel().getLineContent(6), '    cout << "hello world, hi!" << endl;');
            findModel.replace();
            assertFindState(editor, [8, 14, 8, 19], [8, 14, 8, 19], [
                [6, 14, 6, 19],
                [8, 14, 8, 19]
            ]);
            assert.equal(editor.getModel().getLineContent(7), '    cout << "hi world again" << endl;');
            findModel.replace();
            assertFindState(editor, [6, 14, 6, 19], [6, 14, 6, 19], [
                [6, 14, 6, 19]
            ]);
            assert.equal(editor.getModel().getLineContent(8), '    cout << "hi world again" << endl;');
            findModel.replace();
            assertFindState(editor, [6, 16, 6, 16], null, []);
            assert.equal(editor.getModel().getLineContent(6), '    cout << "hi world, hi!" << endl;');
            findModel.dispose();
            findState.dispose();
        });
        findTest('replace bla', function (editor, cursor) {
            var findState = new findState_1.FindReplaceState();
            findState.change({ searchString: 'bla', replaceString: 'ciao' }, false);
            var findModel = new findModel_1.FindModelBoundToEditorModel(editor, findState);
            assertFindState(editor, [1, 1, 1, 1], null, [
                [11, 4, 11, 7],
                [11, 7, 11, 10],
                [11, 10, 11, 13]
            ]);
            findModel.replace();
            assertFindState(editor, [11, 4, 11, 7], [11, 4, 11, 7], [
                [11, 4, 11, 7],
                [11, 7, 11, 10],
                [11, 10, 11, 13]
            ]);
            assert.equal(editor.getModel().getLineContent(11), '// blablablaciao');
            findModel.replace();
            assertFindState(editor, [11, 8, 11, 11], [11, 8, 11, 11], [
                [11, 8, 11, 11],
                [11, 11, 11, 14]
            ]);
            assert.equal(editor.getModel().getLineContent(11), '// ciaoblablaciao');
            findModel.replace();
            assertFindState(editor, [11, 12, 11, 15], [11, 12, 11, 15], [
                [11, 12, 11, 15]
            ]);
            assert.equal(editor.getModel().getLineContent(11), '// ciaociaoblaciao');
            findModel.replace();
            assertFindState(editor, [11, 16, 11, 16], null, []);
            assert.equal(editor.getModel().getLineContent(11), '// ciaociaociaociao');
            findModel.dispose();
            findState.dispose();
        });
        findTest('replaceAll hello', function (editor, cursor) {
            var findState = new findState_1.FindReplaceState();
            findState.change({ searchString: 'hello', replaceString: 'hi', wholeWord: true }, false);
            var findModel = new findModel_1.FindModelBoundToEditorModel(editor, findState);
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            cursor.configuration.handlerDispatcher.trigger('mouse', EditorCommon.Handler.MoveTo, {
                position: new position_1.Position(6, 20)
            });
            assertFindState(editor, [6, 20, 6, 20], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            assert.equal(editor.getModel().getLineContent(6), '    cout << "hello world, Hello!" << endl;');
            findModel.replaceAll();
            assertFindState(editor, [8, 16, 8, 16], null, []);
            assert.equal(editor.getModel().getLineContent(6), '    cout << "hi world, hi!" << endl;');
            assert.equal(editor.getModel().getLineContent(7), '    cout << "hi world again" << endl;');
            assert.equal(editor.getModel().getLineContent(8), '    cout << "hi world again" << endl;');
            findModel.dispose();
            findState.dispose();
        });
        findTest('replaceAll bla', function (editor, cursor) {
            var findState = new findState_1.FindReplaceState();
            findState.change({ searchString: 'bla', replaceString: 'ciao' }, false);
            var findModel = new findModel_1.FindModelBoundToEditorModel(editor, findState);
            assertFindState(editor, [1, 1, 1, 1], null, [
                [11, 4, 11, 7],
                [11, 7, 11, 10],
                [11, 10, 11, 13]
            ]);
            findModel.replaceAll();
            assertFindState(editor, [11, 16, 11, 16], null, []);
            assert.equal(editor.getModel().getLineContent(11), '// ciaociaociaociao');
            findModel.dispose();
            findState.dispose();
        });
        findTest('replaceAll bla with \\t\\n', function (editor, cursor) {
            var findState = new findState_1.FindReplaceState();
            findState.change({ searchString: 'bla', replaceString: '<\\n\\t>', isRegex: true }, false);
            var findModel = new findModel_1.FindModelBoundToEditorModel(editor, findState);
            assertFindState(editor, [1, 1, 1, 1], null, [
                [11, 4, 11, 7],
                [11, 7, 11, 10],
                [11, 10, 11, 13]
            ]);
            findModel.replaceAll();
            assertFindState(editor, [14, 3, 14, 3], null, []);
            assert.equal(editor.getModel().getLineContent(11), '// <');
            assert.equal(editor.getModel().getLineContent(12), '\t><');
            assert.equal(editor.getModel().getLineContent(13), '\t><');
            assert.equal(editor.getModel().getLineContent(14), '\t>ciao');
            findModel.dispose();
            findState.dispose();
        });
        findTest('finds only in editable range if replace is shown', function (editor, cursor) {
            editor.getModel().setEditableRange({
                startLineNumber: 6,
                startColumn: 1,
                endLineNumber: 8,
                endColumn: 1
            });
            var findState = new findState_1.FindReplaceState();
            findState.change({ searchString: 'hello', replaceString: 'hi', wholeWord: true }, false);
            var findModel = new findModel_1.FindModelBoundToEditorModel(editor, findState);
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            findState.change({ isReplaceRevealed: true }, false);
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19]
            ]);
            findModel.dispose();
            findState.dispose();
        });
        findTest('listens to model content changes', function (editor, cursor) {
            var findState = new findState_1.FindReplaceState();
            findState.change({ searchString: 'hello', replaceString: 'hi', wholeWord: true }, false);
            var findModel = new findModel_1.FindModelBoundToEditorModel(editor, findState);
            assertFindState(editor, [1, 1, 1, 1], null, [
                [6, 14, 6, 19],
                [6, 27, 6, 32],
                [7, 14, 7, 19],
                [8, 14, 8, 19]
            ]);
            editor.getModel().setValue('hello\nhi');
            assertFindState(editor, [1, 1, 1, 1], null, []);
            findModel.dispose();
            findState.dispose();
        });
        findTest('issue #1914: NPE when there is only one find match', function (editor, cursor) {
            var findState = new findState_1.FindReplaceState();
            findState.change({ searchString: 'cool.h' }, false);
            var findModel = new findModel_1.FindModelBoundToEditorModel(editor, findState);
            assertFindState(editor, [1, 1, 1, 1], null, [
                [2, 11, 2, 17]
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [2, 11, 2, 17], [2, 11, 2, 17], [
                [2, 11, 2, 17]
            ]);
            findModel.moveToNextMatch();
            assertFindState(editor, [2, 11, 2, 17], [2, 11, 2, 17], [
                [2, 11, 2, 17]
            ]);
            findModel.dispose();
            findState.dispose();
        });
    });
});
//# sourceMappingURL=findModel.test.js.map