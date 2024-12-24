// src/providers/SelectionEventHandler.ts
import * as vscode from 'vscode';

export class SelectionEventHandler {
    private static instance: SelectionEventHandler;
    private _onDidChangeSelection = new vscode.EventEmitter<void>();
    readonly onDidChangeSelection = this._onDidChangeSelection.event;

    private constructor() { }

    static getInstance(): SelectionEventHandler {
        if (!SelectionEventHandler.instance) {
            SelectionEventHandler.instance = new SelectionEventHandler();
        }
        return SelectionEventHandler.instance;
    }

    notifySelectionChanged(): void {
        this._onDidChangeSelection.fire();
    }
}