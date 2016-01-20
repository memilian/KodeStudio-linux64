/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/base/common/flags', 'vs/editor/common/modes/modesRegistry', 'vs/languages/javascript/common/javascript.extensions', 'vs/languages/typescript/common/typescript', 'vs/platform/instantiation/common/descriptors'], function (require, exports, env, modesExt, javascript, typescript, descriptors_1) {
    // contributes the project resolver logic to TypeScript and JavaScript
    // this guy is for the workbench, but not for the standalone editor
    if (env.enableJavaScriptRewriting && !env.enableTypeScriptServiceModeForJS) {
        modesExt.registerWorkerParticipant('javascript', 'vs/languages/typescript/common/js/globalVariableRewriter', 'GlobalVariableCollector');
        modesExt.registerWorkerParticipant('javascript', 'vs/languages/typescript/common/js/angularServiceRewriter', 'AngularServiceRewriter');
        modesExt.registerWorkerParticipant('javascript', 'vs/languages/typescript/common/js/requireRewriter');
        modesExt.registerWorkerParticipant('javascript', 'vs/languages/typescript/common/js/defineRewriter');
        modesExt.registerWorkerParticipant('javascript', 'vs/languages/typescript/common/js/es6PropertyDeclarator');
        modesExt.registerWorkerParticipant('javascript', 'vs/languages/typescript/common/js/importAndExportRewriter', 'ImportsAndExportsCollector');
    }
    typescript.Extensions.setProjectResolver(new descriptors_1.AsyncDescriptor('vs/languages/typescript.workbench/common/projectResolver', undefined, { files: '**/*.ts', projects: '**/tsconfig.json', maxFilesPerProject: 1500 }));
    javascript.Extensions.setProjectResolver(new descriptors_1.AsyncDescriptor('vs/languages/typescript.workbench/common/projectResolver', undefined, { files: '{**/*.js,**/*.d.ts}', projects: '**/jsconfig.json', maxFilesPerProject: 750 }));
});
//# sourceMappingURL=contribution.js.map