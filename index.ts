import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

interface Hosts {
	[key: string]: SybaseEntry[];
}

interface SybaseEntry {
	serviceType: string;
	protocol: string;
	network: string;
	machine: string;
	port: string;
	filter: string | undefined;
}

interface SybaseFilter {
	serviceType?: string;
	protocol?: string;
	network?: string;
	machine?: string;
	port?: string;
	filter?: string | undefined;
}

type SybaseEntryField =
	| 'serviceType' 
	| 'protocol'
	| 'network'
	| 'machine'
	| 'port'
	| 'filter';

let hosts: Hosts = {};

function isEmpty(obj: object) {
	return Object.keys(obj).length === 0;
}

function trimLeft(str: string): string {
  return str.replace(/^[\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF]*/, '');
};

function locateInterfacesFile(): string {
	if (process.env.IFILE != null) {
		return process.env.IFILE!;
	} else if (process.env.SYBASE != null) {
		return path.join(process.env.SYBASE!, 'interfaces');
	} else {
		return '/usr/local/sybase';
	}
}

function loadInterfaces(callback: (blah: any) => void) {
	if (!isEmpty(hosts)) {
		callback(hosts);
	}

	const rl = readline.createInterface({
		input: fs.createReadStream(locateInterfacesFile()),
	});

	let serverName = '';
	rl.on('line', function(line: string) {
		if (/^\S/.test(line)) {  // server name line
			const parts = line.split(' ');
			serverName = parts[0];
			hosts[serverName] = [];
		} else if (/^\s+/.test(line)) { // server entry line
			const parts = trimLeft(line).split(' ');
			const [
				serviceType,
				protocol,
				network,
				machine,
				port,
				filter,
			] = parts;
			hosts[serverName].push({
				serviceType,
				protocol,
				network,
				machine,
				port,
				filter,
			});
		} else {
			// blank line
		}
	});

	rl.on('close', function() {
		callback(hosts);
	});
}

function passesFilter(entry: SybaseEntry, filter: SybaseFilter = {}): boolean {
	return Object.keys(filter).every((key: string) => (
		entry[key as SybaseEntryField] === filter[key as SybaseEntryField]
	));
}

function filterEntries(serverName: string, filter: SybaseFilter, callback: (entries: SybaseEntry[]) => void): void {
	loadInterfaces(function(hosts) {
		const allEntries = hosts[serverName];
		const matchingEntries = allEntries.filter((m: SybaseEntry) => passesFilter(m, filter));
		callback(matchingEntries);
	});
}

function findEntry(serverName: string, filter: SybaseFilter, callback: (entry: SybaseEntry) => void): void {
	loadInterfaces(function(hosts) {
		const allEntries = hosts[serverName];
		const queryEntry = allEntries.find((m: SybaseEntry) => passesFilter(m, filter));
		callback(queryEntry);
	});
}

module.exports = {
	filterEntries: filterEntries,
	findEntry: findEntry,
};
