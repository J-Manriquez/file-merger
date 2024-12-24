import path = require('path');
import * as vscode from 'vscode';

export interface StoredSelection {
    name: string;
    files: string[];
    isActive: boolean;
}

// Nueva clase para representar los archivos en el árbol
class SelectionFileItem extends vscode.TreeItem {
    constructor(public readonly filePath: string) {
        super(path.basename(filePath));
        this.tooltip = filePath;
        this.contextValue = 'selectionFile';
        this.iconPath = new vscode.ThemeIcon('file');
    }
}

// Nueva clase para representar las selecciones en el árbol
class SelectionItem extends vscode.TreeItem {
    constructor(
        public readonly selection: StoredSelection
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
    }
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

    getSavedSelectionsProvider(): vscode.TreeDataProvider<SelectionItem | SelectionFileItem> {
        return {
            getTreeItem: (element: SelectionItem | SelectionFileItem) => element,

            getChildren: (element?: SelectionItem): (SelectionItem | SelectionFileItem)[] => {
                if (!element) {
                    // Nivel raíz: mostrar todas las selecciones
                    return this.getAllSelections().map(selection =>
                        new SelectionItem(selection)
                    );
                } else {
                    // Nivel hijo: mostrar los archivos de la selección
                    return element.selection.files.map(file =>
                        new SelectionFileItem(file)
                    );
                }
            },

            getParent: (element: SelectionItem | SelectionFileItem) => {
                if (element instanceof SelectionFileItem) {
                    // Buscar la selección padre
                    const selections = this.getAllSelections();
                    const parentSelection = selections.find(s =>
                        s.files.includes(element.filePath)
                    );
                    return parentSelection ?
                        new SelectionItem(parentSelection) :
                        null;
                }
                return null;
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