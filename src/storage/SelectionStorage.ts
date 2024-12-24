// src/storage/SelectionStorage.ts
import * as vscode from 'vscode';

interface StoredSelection {
    name: string;
    files: string[];
    isActive: boolean;
}

export class SelectionStorage {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    saveSelection(name: string, files: string[]): void {
        const selections = this.getAllSelections();
        selections.push({
            name,
            files,
            isActive: false
        });
        this.context.globalState.update('selections', selections);
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
        }
    }

    deleteSelection(name: string): void {
        const selections = this.getAllSelections();
        const updatedSelections = selections.filter(s => s.name !== name);
        this.context.globalState.update('selections', updatedSelections);
    }
}