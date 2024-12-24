import * as vscode from 'vscode';
import * as path from 'path';

export class FileTreeItem extends vscode.TreeItem {
    constructor(
        public readonly uri: vscode.Uri,
        public readonly type: vscode.FileType,
        public isSelected: boolean = false
    ) {
        super(
            path.basename(uri.fsPath),
            type === vscode.FileType.Directory
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None
        );

        this.tooltip = this.uri.fsPath;
        this.contextValue = type === vscode.FileType.Directory ? 'directory' : 'file';

        // Configurar checkbox
        this.checkboxState = isSelected ? vscode.TreeItemCheckboxState.Checked : vscode.TreeItemCheckboxState.Unchecked;

        // Configurar ícono
        this.iconPath = type === vscode.FileType.Directory
            ? new vscode.ThemeIcon('folder')
            : new vscode.ThemeIcon('file');
    }
}

export class FileExplorerProvider implements vscode.TreeDataProvider<FileTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<FileTreeItem | undefined | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    private selectedItems = new Set<string>();

    constructor() { }

    getTreeItem(element: FileTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: FileTreeItem): Promise<FileTreeItem[]> {
        try {
            let uri: vscode.Uri;
            if (!element) {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders) {
                    return [];
                }
                uri = workspaceFolders[0].uri;
            } else {
                uri = element.uri;
            }

            const entries = await vscode.workspace.fs.readDirectory(uri);
            return entries
                .map(([name, type]) => {
                    const entryUri = vscode.Uri.joinPath(uri, name);
                    const isSelected = this.selectedItems.has(entryUri.fsPath);
                    return new FileTreeItem(entryUri, type, isSelected);
                })
                .sort((a, b) => {
                    if (a.contextValue === b.contextValue) {
                        return a.label!.toString().localeCompare(b.label!.toString());
                    }
                    return a.contextValue === 'directory' ? -1 : 1;
                });
        } catch (error) {
            console.error('Error reading directory:', error);
            return [];
        }
    }

    async toggleSelection(item: FileTreeItem): Promise<void> {
        const toggleItem = async (fileItem: FileTreeItem) => {
            if (fileItem.type === vscode.FileType.Directory) {
                const children = await this.getChildren(fileItem);
                for (const child of children) {
                    await toggleItem(child);
                }
            }

            if (this.selectedItems.has(fileItem.uri.fsPath)) {
                this.selectedItems.delete(fileItem.uri.fsPath);
                fileItem.checkboxState = vscode.TreeItemCheckboxState.Unchecked;
            } else {
                this.selectedItems.add(fileItem.uri.fsPath);
                fileItem.checkboxState = vscode.TreeItemCheckboxState.Checked;
            }
        };

        await toggleItem(item);
        this._onDidChangeTreeData.fire();
    }

    // Añade este método para limpiar todas las selecciones
    clearSelections(): void {
        this.selectedItems.clear();
        this._onDidChangeTreeData.fire();

    }

    getSelectedFiles(): string[] {
        return Array.from(this.selectedItems);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
}