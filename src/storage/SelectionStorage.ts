import * as vscode from 'vscode';

export interface StoredSelection {
    name: string;
    files: string[];
    isActive: boolean;
}

export class SelectionStorage {
    private _onDidChangeSelections = new vscode.EventEmitter<void>();
    readonly onDidChangeSelections = this._onDidChangeSelections.event;

    constructor(private context: vscode.ExtensionContext) { }

    saveSelection(name: string, files: string[]): void {
        const selections = this.getAllSelections();
        selections.push({
            name,
            files,
            isActive: false
        });
        this.context.globalState.update('selections', selections);
        this._onDidChangeSelections.fire();
    }

    updateSelection(name: string, files: string[]): void {
        const selections = this.getAllSelections();
        const index = selections.findIndex(s => s.name === name);
        if (index !== -1) {
            selections[index].files = files;
            this.context.globalState.update('selections', selections);
            this._onDidChangeSelections.fire();
        }
    }

    getAllSelections(): StoredSelection[] {
        return this.context.globalState.get<StoredSelection[]>('selections', []);
    }

    getActiveSelections(): StoredSelection[] {
        return this.getAllSelections().filter(s => s.isActive);
    }

    toggleSelectionActive(name: string): void {
        const selections = this.getAllSelections();
        const selection = selections.find(s => s.name === name);
        if (selection) {
            selection.isActive = !selection.isActive;
            this.context.globalState.update('selections', selections);
            this._onDidChangeSelections.fire();
        }
    }

    deleteSelection(name: string): void {
        const selections = this.getAllSelections();
        const updatedSelections = selections.filter(s => s.name !== name);
        this.context.globalState.update('selections', updatedSelections);
        this._onDidChangeSelections.fire();
    }

    getSavedSelectionsProvider(): vscode.TreeDataProvider<vscode.TreeItem> {
        return {
            getTreeItem: (element: vscode.TreeItem) => element,
            getChildren: () => {
                return this.getAllSelections().map(selection => {
                    const item = new vscode.TreeItem(selection.name);
                    item.contextValue = 'savedSelection';
                    item.tooltip = `Files: ${selection.files.length}`;
                    item.description = selection.isActive ? '(Active)' : '';
                    item.iconPath = selection.isActive ? new vscode.ThemeIcon('eye') : new vscode.ThemeIcon('eye-closed');
                    return item;
                });
            }
        };
    }

    getActiveSelectionsProvider(): vscode.TreeDataProvider<vscode.TreeItem> {
        return {
            getTreeItem: (element: vscode.TreeItem) => element,
            getChildren: () => {
                return this.getActiveSelections().map(selection => {
                    const item = new vscode.TreeItem(selection.name);
                    item.contextValue = 'activeSelection';
                    item.tooltip = `Files: ${selection.files.length}`;
                    item.iconPath = new vscode.ThemeIcon('eye');
                    return item;
                });
            }
        };
    }
}