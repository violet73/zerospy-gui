// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {CctNodeProvider, Dependency} from './programCct';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const provider = new CctNodeProvider('./');
	
	vscode.window.registerTreeDataProvider("programCct", provider);
	vscode.commands.registerCommand('programCct.refreshEntry', () => provider.refresh());
	vscode.commands.registerCommand('programCct.openFile', (element: Dependency) => provider.open(element));

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
}

// this method is called when your extension is deactivated
export function deactivate() {}
