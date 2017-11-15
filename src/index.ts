/**
 * @module sybase-interfaces-loader
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

export type SybaseEntryField =
  | 'serviceType'
  | 'protocol'
  | 'network'
  | 'machine'
  | 'port'
  | 'filter';

export interface IHosts {
  [key: string]: ISybaseEntry[];
}

export interface ISybaseEntry {
  serviceType: string;
  protocol: string;
  network: string;
  machine: string;
  port: string;
  filter: string | undefined;
}

export interface ISybaseFilter {
  serviceType?: string;
  protocol?: string;
  network?: string;
  machine?: string;
  port?: string;
  filter?: string | undefined;
}

// tslint:disable-next-line:prefer-const
let hosts: IHosts = {};

function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

function trimLeft(str: string): string {
  const leadingWhitespace: RegExp = /^[\s\t]*/;

  return str.replace(leadingWhitespace, '');
}

function locateInterfacesFile(): string {
  if (process.env.IFILE != null) {
    return <string>process.env.IFILE;
  } else if (process.env.SYBASE != null) {
    return path.join(<string>process.env.SYBASE, 'interfaces');
  } else {
    return '/usr/local/sybase/interfaces';
  }
}

function loadInterfaces(callback: (hosts: IHosts) => void): void {
  if (!isEmpty(hosts)) {
    callback(hosts);
  }

  const rl: readline.ReadLine = readline.createInterface({
    input: fs.createReadStream(locateInterfacesFile())
  });

  let serverName: string = '';
  rl.on('line', (line: string) => {
    if (/^\S/.test(line)) {  // server name line
      const parts: string[] = line.split(' ');
      serverName = parts[0];
      hosts[serverName] = [];
    } else if (/^\s+/.test(line)) { // server entry line
      const parts: string[] = trimLeft(line).split(' ');
      const [
        serviceType,
        protocol,
        network,
        machine,
        port,
        filter
      ] = parts;
      hosts[serverName].push({
        serviceType,
        protocol,
        network,
        machine,
        port,
        filter
      });
    } else {
      // blank line
    }
  });

  rl.on('close', () => callback(hosts));
}

function passesFilter(entry: ISybaseEntry, filter: ISybaseFilter = {}): boolean {
  return Object.keys(filter).every((key: string) => (
    entry[<SybaseEntryField>key] === filter[<SybaseEntryField>key]
  ));
}

export function filterEntries(serverName: string, filter: ISybaseFilter, callback: (entries: ISybaseEntry[]) => void): void {
  loadInterfaces((h: IHosts) => {
    const allEntries: ISybaseEntry[] = h[serverName];
    const matchingEntries: ISybaseEntry[] = allEntries.filter((m: ISybaseEntry) => passesFilter(m, filter));
    callback(matchingEntries);
  });
}

export function findEntry(serverName: string, filter: ISybaseFilter, callback: (entry: ISybaseEntry | undefined) => void): void {
  loadInterfaces((h: IHosts) => {
    const allEntries: ISybaseEntry[] = h[serverName];
    const queryEntry: ISybaseEntry | undefined = allEntries.find((m: ISybaseEntry) => passesFilter(m, filter));
    callback(queryEntry);
  });
}
