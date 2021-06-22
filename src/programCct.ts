import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
type Dict = {[k:string]: any};

export class CctNodeProvider implements vscode.TreeDataProvider<Dependency> {

	private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined | void> = new vscode.EventEmitter<Dependency | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Dependency | undefined | void> = this._onDidChangeTreeData.event;
    data: Dependency[];

	constructor(private workspaceRoot: string) {
        this.data = [];
		
        const cctJson = JSON.parse(fs.readFileSync('C:/Users/雷克伦/Desktop/三下/vscode-cct/zerospy-gui/src/cct.json', 'utf-8'));
		// this.highlight();
        Object.keys(cctJson).forEach((key) => {
            let child = cctJson[key].child;
            let cctItem = new Dependency(key, cctJson[key].otherInfo.path, cctJson[key].otherInfo.line, cctJson[key].otherInfo.redmap, child === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed, child);
            this.data.push(cctItem);
        });
	}

	// async highlight(): Promise<void> {
	// 	let uriOfWorkspace = vscode.Uri.file('C:/Users/雷克伦/Desktop/三下/vscode-cct/zerospy-gui/src/cct.json');
	// 	await vscode.commands.executeCommand('vscode.openFolder', uriOfWorkspace);
	// 	await vscode.commands.executeCommand('vscode.executeDocumentHighlights', uriOfWorkspace, new vscode.Position(1, 1));
	// 	if(vscode.window.activeTextEditor !== undefined) {
	// 		await vscode.commands.executeCommand('editor.action.goToLocations', vscode.window.activeTextEditor.document.uri, vscode.window.activeTextEditor.selection.start, [new vscode.Location(uriOfWorkspace, new vscode.Position(200, 6))], 'goto', 'No Super Types Found');
	// 	}
	// 	// vscode.DocumentHighlight.
	// }

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	async open(element: Dependency): Promise<void> {
		let uriOfWorkspace = vscode.Uri.file(element.path);
		// await vscode.commands.executeCommand('vscode.openFolder', uriOfWorkspace);
		await vscode.commands.executeCommand('editor.action.goToLocations', uriOfWorkspace, new vscode.Position(0, 0), [new vscode.Location(uriOfWorkspace, new vscode.Position(element.line - 1, 0))], 'goto', 'No Super Types Found');
	}

	getTreeItem(element: Dependency): vscode.TreeItem {
		return element;
	}

	getChildren(element?: Dependency | undefined): vscode.ProviderResult<Dependency[]> {
        if (element === undefined) {
            return this.data;
        }
		if(element.children === undefined) {
			return [];
		}
        let childData:Dependency[] = [];
        for(let i = 0; i < element.children?.length ; i++) {
			let childJson = element.children[i];
			
            Object.keys(childJson).forEach((key) => {
                let child = childJson[key].child;
                let cctItem = new Dependency(key, childJson[key].otherInfo.path, childJson[key].otherInfo.line,childJson[key].otherInfo.redmap, child === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed, child);
                childData.push(cctItem);
            });
            
        }
        return childData;
	}
}

export class Dependency extends vscode.TreeItem {
    public children: Dict[] | undefined;

	constructor(
		public readonly label: string,
		public readonly path: string,
		public readonly line: number,
		private readonly version: string,//redmap
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        children?: Dependency[] | undefined,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
        this.children = children;
		this.tooltip = `${this.label}-${this.version}`;
		this.description = this.version;
	}

	// iconPath = {
	// 	light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
	// 	dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	// };

	contextValue = 'dependency';
}