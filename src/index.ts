/**
 * @module sybase-interfaces-loader
 */

import * as es from 'event-stream';
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

function loadInterfaces(): IHosts {
  if (!isEmpty(hosts)) {
    return hosts;
  }

  const rl: readline.ReadLine = readline.createInterface({
    input: fs.createReadStream(locateInterfacesFile())
  });

  const lines: string[] = fs.readFileSync(locateInterfacesFile()).toString().split('\n');

  let serverName: string = '';
  lines.forEach((line: string) => {
    if (/^\S/.test(line)) {  // server name line
      const parts: string[] = line.split(' ');
      serverName = parts[0];
      hosts[serverName] = [];
    } else if (/^\s+/.test(line)) { // server entry line
      const parts: string[] = trimLeft(line).split(' ');
      hosts[serverName].push({
        serviceType: parts[0],
        protocol: parts[1],
        network: parts[2],
        machine: parts[3],
        port: parts[4],
        filter: parts[5]
      });
    }
  });

  return hosts;
}

function passesFilter(entry: ISybaseEntry, filter: ISybaseFilter = {}): boolean {
  return Object.keys(filter).every((key: string) => (
    entry[<SybaseEntryField>key] === filter[<SybaseEntryField>key]
  ));
}

export function filterEntries(serverName: string, filter: ISybaseFilter = {}): ISybaseEntry[] {
  const h: IHosts = loadInterfaces();
  const allEntries: ISybaseEntry[] = h[serverName] || [];

  return allEntries.filter((m: ISybaseEntry) => passesFilter(m, filter));
}

export function findEntry(serverName: string, filter: ISybaseFilter = {}): ISybaseEntry | undefined {
  const h: IHosts = loadInterfaces();
  const allEntries: ISybaseEntry[] | undefined = h[serverName];

  if (allEntries == null) {
    return undefined;
  } else {
    return allEntries.find((m: ISybaseEntry) => passesFilter(m, filter));
  }
}
