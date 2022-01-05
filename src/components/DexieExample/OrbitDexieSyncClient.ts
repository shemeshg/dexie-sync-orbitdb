import { ApplyRemoteChangesFunction, IPersistedContext, ISyncProtocol, PollContinuation, ReactiveContinuation } from 'dexie-syncable/api';
import { IDatabaseChange } from 'dexie-observable/api';
import { v4 as uuidv4 } from 'uuid';

import { orbitDexieSyncServerSide } from './OrbitDexieSyncServerSide';
import { ChangeItf } from "./ChangesStore"



export const SYNCABLE_PROTOCOL = 'orbitdb';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let onClientAppliedUpdates = (changes: ChangeItf[]): void => {
  return;
}

const POLL_INTERVAL = 3000; // Poll every 10th second

async function doServerSide(request: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clientIdentity: any;
  baseRevision: unknown;
  partial: boolean;
  changes: IDatabaseChange[];
  syncedRevision: unknown;
  url: string;
},
  applyRemoteChanges: ApplyRemoteChangesFunction,
  onChangesAccepted: () => void,
  onSuccess: (continuation: PollContinuation | ReactiveContinuation) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError: (error: any, again?: number) => void,
  partial: boolean
): Promise<void> {
  try {
    const serverSideData = await orbitDexieSyncServerSide.OrbitDixieServerSide(request)

    let serverSideChanges = serverSideData?.changes || []
    serverSideChanges = serverSideChanges.sort((firstItem, secondItem) => firstItem.rev - secondItem.rev);
    await applyRemoteChanges(serverSideChanges as unknown as IDatabaseChange[], serverSideData?.currentRevision, partial)
  
    onChangesAccepted()
    await orbitDexieSyncServerSide.changesStore?.setCountersAfterApply(request.clientIdentity, serverSideData.countersToSetAfterApply)
    onClientAppliedUpdates(serverSideChanges)
    onSuccess({ again: POLL_INTERVAL });
  } catch(e){
    onError(e, Infinity);
  }



  

}

export function setOnClientAppliedUpdates(fc: (changes: ChangeItf[]) => void): void {
  onClientAppliedUpdates = fc
}



export class OrbitDexieSyncClient implements ISyncProtocol {


  sync(
    context: IPersistedContext,
    url: string,
    options: unknown,
    baseRevision: unknown,
    syncedRevision: unknown,
    changes: IDatabaseChange[],
    partial: boolean,
    applyRemoteChanges: ApplyRemoteChangesFunction,
    onChangesAccepted: () => void,
    onSuccess: (continuation: PollContinuation | ReactiveContinuation) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any, again?: number) => void): void {

    if (!context.clientIdentity) {
      context.clientIdentity = uuidv4()
      context.save
    }


    const request = {
      clientIdentity: context.clientIdentity || null,
      baseRevision: baseRevision,
      partial: partial,
      changes: changes,
      syncedRevision: syncedRevision,
      url: url
    };




    doServerSide(request, applyRemoteChanges, onChangesAccepted, onSuccess, onError, partial)

    return;
  }

}
