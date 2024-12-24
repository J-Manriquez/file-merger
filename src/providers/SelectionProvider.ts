// src/providers/SelectionProvider.ts
import * as vscode from 'vscode';
import { SelectionStorage } from '../storage/SelectionStorage';
import { FileManager } from '../managers/FileManager';

export class SelectionProvider {
    private currentSelection: string[] = [];

    constructor(
        private storage: SelectionStorage,
        private fileManager: FileManager
    ) { }

    // Añadir el método que faltaba
    async saveCurrentSelection(name: string): Promise<void> {
        if (this.currentSelection.length > 0) {
            this.storage.saveSelection(name, this.currentSelection);
            vscode.window.showInformationMessage(`Selection "${name}" saved successfully`);
        } else {
            vscode.window.showWarningMessage('No files selected to save');
        }
    }

    getSavedSelectionsProvider(): vscode.TreeDataProvider<vscode.TreeItem> {
        return {
            getTreeItem: (element) => element,
            getChildren: () => {
                return this.storage.getAllSelections().map(selection => {
                    const item = new vscode.TreeItem(selection.name);
                    item.contextValue = 'savedSelection';
                    item.command = {
                        command: 'fileMerger.useSelection',
                        title: 'Use Selection',
                        arguments: [selection]
                    };
                    return item;
                });
            }
        };
    }

    getActiveSelectionsProvider(): vscode.TreeDataProvider<vscode.TreeItem> {
        return {
            getTreeItem: (element) => element,
            getChildren: () => {
                return this.storage.getActiveSelections().map(selection => {
                    const item = new vscode.TreeItem(selection.name);
                    item.contextValue = 'activeSelection';
                    return item;
                });
            }
        };
    }

    async createNewSelection(): Promise<void> {
        const files = await vscode.window.showOpenDialog({
            canSelectMany: true,
            canSelectFolders: true
        });

        if (files) {
            const expandedFiles = await this.expandFolders(files.map(f => f.fsPath));
            await this.fileManager.mergeFiles(expandedFiles);
        }
    }


    private async expandFolders(paths: string[]): Promise<string[]> {
        const expandedFiles: string[] = [];

        for (const path of paths) {
            const stat = await vscode.workspace.fs.stat(vscode.Uri.file(path));
            if (stat.type === vscode.FileType.Directory) {
                const files = await vscode.workspace.findFiles(
                    new vscode.RelativePattern(path, '**/*')
                );
                expandedFiles.push(...files.map(f => f.fsPath));
            } else {
                expandedFiles.push(path);
            }
        }

        return expandedFiles;
    }

}