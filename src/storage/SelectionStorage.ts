import path = require('path');
import * as vscode from 'vscode';
import { FileManager } from '../managers/FileManager';

export interface StoredSelection {
    name: string;
    files: string[];
    isActive: boolean;
}

// Clase para representar los archivos en el árbol
class SelectionFileItem extends vscode.TreeItem {
    constructor(public readonly filePath: string) {
        super(path.basename(filePath));
        this.tooltip = filePath;
        this.contextValue = 'selectionFile';
        this.iconPath = new vscode.ThemeIcon('file');
    }
}

// Clase para representar las selecciones en el árbol
export class SelectionItem extends vscode.TreeItem {
    constructor(
        public readonly selection: StoredSelection,
        private fileManager: FileManager // Añadir FileManager como dependencia
    ) {
        super(
            selection.name,
            vscode.TreeItemCollapsibleState.Collapsed
        );
        this.contextValue = 'savedSelection';
        this.tooltip = `Files: ${selection.files.length}`;
        this.description = selection.isActive ? '(Active)' : '';
        this.iconPath = selection.isActive ?
            new vscode.ThemeIcon('eye') :
            new vscode.ThemeIcon('eye-closed');

        // Añadir comando para abrir el archivo merge
        this.command = {
            command: 'fileMerger.openMergedFile',
            title: 'Open Merged File',
            arguments: [this]
        };
    }
}

export class SelectionStorage {
    private _onDidChangeSelections = new vscode.EventEmitter<void>();
    readonly onDidChangeSelections = this._onDidChangeSelections.event;
    private treeDataProvider: vscode.TreeDataProvider<SelectionItem | SelectionFileItem> | undefined;

    constructor(
        private context: vscode.ExtensionContext,
        private fileManager: FileManager
    ) {
        this.treeDataProvider = this.getSavedSelectionsProvider();
    }
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


    getSavedSelectionsProvider(): vscode.TreeDataProvider<SelectionItem | SelectionFileItem> {
        return {
            getTreeItem: (element: SelectionItem | SelectionFileItem) => element,
            onDidChangeTreeData: this._onDidChangeSelections.event,

            getChildren: (element?: SelectionItem): (SelectionItem | SelectionFileItem)[] => {
                if (!element) {
                    return this.getAllSelections().map(selection =>
                        new SelectionItem(selection, this.fileManager)
                    );
                }
                return element.selection.files.map(file =>
                    new SelectionFileItem(file)
                );
            }
        };
    }


    refresh(): void {
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


    async toggleSelectionActive(name: string): Promise<void> {
        const selections = this.getAllSelections();
        const selection = selections.find(s => s.name === name);
        if (selection) {
            selection.isActive = !selection.isActive;
            await this.context.globalState.update('selections', selections);

            if (selection.isActive) {
                await this.fileManager.startWatching(selection.name, selection.files);
                vscode.window.showInformationMessage(`Selection "${selection.name}" is now active`);
            } else {
                this.fileManager.stopWatching(selection.name);
                vscode.window.showInformationMessage(`Selection "${selection.name}" is now inactive`);
            }

            this._onDidChangeSelections.fire();
        }
    }

    deleteSelection(name: string): void {
        const selections = this.getAllSelections();
        const updatedSelections = selections.filter(s => s.name !== name);
        this.context.globalState.update('selections', updatedSelections);
        this._onDidChangeSelections.fire();
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