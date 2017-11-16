/**
 * test
 */
import { assert } from 'chai';
import * as mock from 'mock-fs';

import {
  filterEntries,
  findEntry,
  ISybaseEntry
} from '../src';

const expectedMasterEntry: ISybaseEntry = {
  serviceType: 'master',
  protocol: 'tcp',
  network: 'ether',
  machine: 'alpha.example.com',
  port: '4100',
  filter: undefined
};
const expectedQueryEntry: ISybaseEntry = { ...expectedMasterEntry, serviceType: 'query' };

const interfacesFileContent: string =
`alpha
\tmaster tcp ether alpha.example.com 4100
\tquery tcp ether alpha.example.com 4100
beta
\tmaster tcp ether beta.example.com 4100
\tquery tcp ether beta.example.com 4100
gamma
\tmaster tcp ether gamma.example.com 4100
\tquery tcp ether gamma.example.com 4100
`;

function mockInterfacesFile(): void {
  mock({
      '/usr/local/sybase/interfaces': interfacesFileContent
  });
  delete process.env.SYBASE;
  delete process.env.IFILE;
}

function restoreInterfacesFile(): void {
  mock.restore();
}

describe('filterEntries', () => {
  before(mockInterfacesFile);
  after(restoreInterfacesFile);

  it('should retrieve the master and query entries when both exist', () => {
    const entries: ISybaseEntry[] = filterEntries('alpha');
    assert.lengthOf(entries, 2, 'entries length is 2');
    const masterEntry: ISybaseEntry = <ISybaseEntry>entries.find((e: ISybaseEntry) => e.serviceType === 'master');
    const queryEntry: ISybaseEntry = <ISybaseEntry>entries.find((e: ISybaseEntry) => e.serviceType === 'query');
    assert.deepEqual(masterEntry, expectedMasterEntry);
    assert.deepEqual(queryEntry, expectedQueryEntry);
  });

  it('should do something about IFILE', () => {
    assert.equal(process.env.IFILE, null, 'blah');
  });
});

describe('findEntry', () => {
  before(mockInterfacesFile);
  after(restoreInterfacesFile);

  it('should return the first matching entry matching', () => {
    const entry: ISybaseEntry | undefined = findEntry('alpha');
    assert.deepEqual(entry, expectedMasterEntry);
  });

  it('should respect filters to match entries', () => {
    const entry: ISybaseEntry | undefined = findEntry('alpha', { serviceType: 'query' });
    assert.deepEqual(entry, expectedQueryEntry);
  });

  it('should return undefined when no entry is found', () => {
    const entry: ISybaseEntry | undefined = findEntry('delta');
    assert.notExists(entry, 'entry does not exist');
  });
});
