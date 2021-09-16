'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as lsclient from 'vscode-languageclient/node';

import { getClient } from '../../client';
import { getDocUri } from '../../common/helper';
import { IntegrationSamples, Client } from '../../common/types';

suite('Error Navigation', function () {
	this.timeout(10000);

	let client!: Client;
	let vscodeClient!: lsclient.LanguageClient;

	suiteSetup(async () => {
		client = await getClient();
		vscodeClient = client.getVSCodeClient();
	});

	const integrationSamples: IntegrationSamples[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'errorNavigation.test.json'), 'utf8'));
	for (const sample of integrationSamples) {
		test(sample.title, async () => {
			for (const action of sample.actions) {
				const docUri = getDocUri(__dirname, action.uri);

				if (client.docUri?.path !== docUri.path) {
					await client.changeDocument(docUri);
				}
	
				const fn = client.navigationProvider[`do${action.action}`].bind(client.navigationProvider);
				if (!fn) {
					throw new Error("Action request not implemented!");
				}
	
				await fn(client.document, action);
			}
		});
	}
});
