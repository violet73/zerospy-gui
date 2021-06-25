// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
const path = require('path');
const fs = require('fs');
import {CctNodeProvider, Dependency} from './programCct';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const provider = new CctNodeProvider(path.join(context.extensionPath, 'cct'));
	
	vscode.window.registerTreeDataProvider("programCct", provider);
	vscode.commands.registerCommand('programCct.refreshEntry', () => provider.refresh());
	vscode.commands.registerCommand('programCct.openFile', (element: Dependency) => provider.open(element));

	let collection = vscode.languages.createDiagnosticCollection('warning high Fully Redundant Zero');

	if (vscode.window.activeTextEditor) {
		updateDiagnostics(vscode.window.activeTextEditor.document, collection);
	}
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor) {
			updateDiagnostics(editor.document, collection);
		}
	}));

	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
		if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
			updateDiagnostics(vscode.window.activeTextEditor.document, collection);
		}
	}));

	const provider1 = vscode.languages.registerFoldingRangeProvider('log', {

		provideFoldingRanges(document: vscode.TextDocument, context: vscode.FoldingContext, token: vscode.CancellationToken): vscode.ProviderResult<vscode.FoldingRange[]> {
			// console.log('====== 进入 provideFoldingRanges 方法 ======');
			let start = -1, end = -1;
			let result:vscode.FoldingRange[] = [];
			for(let i = 0; i < document.lineCount; i++) {
				let line = document.lineAt(i);
				if(/=+ \(\d+\.\d+\).*/.test(line.text)) {
					start = i;
				}
				if(/PROCESS.*/.test(line.text)) {
					end = i;
					result.push(new vscode.FoldingRange(start, end));
				}
				if(/Truncated call path \(due to client deep call chain\)/.test(line.text)) {
					end = i;
					result.push(new vscode.FoldingRange(start, end));
				}
			}

			// return all completion items as array
			return result;
		}
	});
	context.subscriptions.push(provider1);

	const provider2 = vscode.languages.registerHoverProvider('log', {

		provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
			// console.log('====== 进入 provideFoldingRanges 方法 ======');
				let line = document.lineAt(position.line);
				if(/=+ with All Zero Redundant \d+\.\d+ % \(\d+ \/ \d+\) =+/.test(line.text)) {
					let num = line.text.match(/\d+\.\d+/g);
					// TODO 30 can custom
					if(num !== null && parseInt(num[0]) > 30) {
						return new vscode.Hover(`The Fully Redundant Zero is higher than 30%. There may be optimization opportunities to optimize with statements to skip the redundant memory loads and corresponding computations.`);
					}
				}
		}
	});
	context.subscriptions.push(provider2);

	const provider3 = vscode.languages.registerDefinitionProvider('log', {

		provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition> {
			console.log('====== 进入 provideDefinition 方法 ======');
			const fileName = document.fileName;
			const workDir = path.dirname(fileName);
			const line = document.lineAt(position);
			const word = document.getText(document.getWordRangeAtPosition(position));

			if(word === 'detail' && /Thread.*detail/.test(line.text)) {
				let file = line.text.match(/\w+\.\w+/g);
				console.log(file);
				if(file !== null) {
					let destPath = `${workDir}/${file[0]}`;
					if (fs.existsSync(destPath)) {
						// new vscode.Position(0, 0) 表示跳转到某个文件的第一行第一列
						return new vscode.Location(vscode.Uri.file(destPath), new vscode.Position(0, 0));
					}
				}
			}
		}
	});
	context.subscriptions.push(provider3);
}

function updateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection): void {
	let digArr:vscode.Diagnostic[] = [];
	if (document) {
		for(let i = 0; i < document.lineCount; i++) {
			let line = document.lineAt(i);
			
			if(/=+ with All Zero Redundant \d+\.\d+ % \(\d+ \/ \d+\) =+/.test(line.text)) {
				let num = line.text.match(/\d+\.\d+/g);
				// TODO 30 can custom
				if(num !== null && parseInt(num[0]) > 30) {
					let dig = {
						code: '',
						message: 'detected high Fully Redundant Zero!',
						range: line.range,
						severity: vscode.DiagnosticSeverity.Warning,
						source: '',
						relatedInformation: []
					};
					digArr.push(dig);
				}
			}
		}
		collection.set(document.uri, digArr);
	} else {
		collection.clear();
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
