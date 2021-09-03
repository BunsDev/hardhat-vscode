import * as path from 'path';
import * as vscode from 'vscode';
import * as assert from 'assert';

export type IndexFileData = {
	path: string,
	current: number,
	total: number,
};

export type IntegrationSamples = {
	/**
	 * Test title.
	 */
	title: string,
	/**
	 * The name of the action to be executed.
	 */
	action: string,
	/**
	 * Optional param. Currently used only in RenameRequest.
	 */
	new_name?: string | undefined,
	/**
	 * The path to the file for which we run the test.
	 * The path is specified in the relative path of the ./test/testdata/ directory.
	 */
	uri: string,
	/**
     * Represents a line and character position, such as the position of the cursor.
	 */
	position: {
		/**
         * The zero-based line value.
         */
		line: number,
        /**
         * The zero-based character value.
         */
		character: number
	},
	/**
	 * The expected result of the action.
	 */
	expected: any
}

export let document: vscode.TextDocument;
export let editor: vscode.TextEditor;

/**
 * Activates the tenderly.solidity-extension extension
 */
export async function activate(docUri: vscode.Uri) {
	// The extensionId is `publisher.name` from package.json
	const ext = vscode.extensions.getExtension('tenderly.solidity-extension')!;
	await ext.activate();

	try {
		document = await vscode.workspace.openTextDocument(docUri);
		editor = await vscode.window.showTextDocument(document);

		await sleep(2000); // Wait for server activation
	} catch (e) {
		console.error(e);
	}
}

export async function changeDocument(docUri: vscode.Uri) {
	try {
		document = await vscode.workspace.openTextDocument(docUri);
		editor = await vscode.window.showTextDocument(document);
	} catch (e) {
		console.error(e);
	}
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const getDocPath = (p: string) => {
	return path.resolve(__dirname, '../../../test/testdata', p);
};

export const getDocUri = (p: string) => {
	return vscode.Uri.file(getDocPath(p));
};

export function rangeEqual(range: vscode.Range, sl: number, sc: number, el: number, ec: number): void {
    assert.strictEqual(range.start.line, sl);
    assert.strictEqual(range.start.character, sc);
    assert.strictEqual(range.end.line, el);
    assert.strictEqual(range.end.character, ec);
}

export function uriEqual(actual: vscode.Uri, expected: vscode.Uri): void {
	const actualPath = actual.path.match(/test\/testdata(.*)/)[0];
	const expectedPath = expected.path.match(/test\/testdata(.*)/)[0];

    assert.strictEqual(actualPath, expectedPath);
}

export function isDefined<T>(value: T | undefined | null): asserts value is Exclude<T, undefined | null> {
    if (value === undefined || value === null) {
        throw new Error(`Value is null or undefined`);
    }
}

export function isInstanceOf<T>(value: T, clazz: any): asserts value is Exclude<T, undefined | null> {
    assert.ok(value instanceof clazz);
}

export function isArray<T>(value: Array<T> | undefined | null, length = 1): asserts value is Array<T> {
    assert.ok(Array.isArray(value), `value is array`);
    assert.strictEqual(value!.length, length, 'value has given length');
}
