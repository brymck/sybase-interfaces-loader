/**
 * Interface definitions
 */

export type Maybe<T> = T | undefined;

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
  filter: Maybe<string>;
}

export interface ISybaseFilter {
  serviceType?: string;
  protocol?: string;
  network?: string;
  machine?: string;
  port?: string;
  filter?: Maybe<string>;
}
