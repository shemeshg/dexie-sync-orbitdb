import CounterStore from "orbit-db-counterstore"
import DocumentStore from "orbit-db-docstore"
import EventStore from "orbit-db-eventstore"
import FeedStore from "orbit-db-feedstore"
import KeyValueStore from "orbit-db-kvstore"
import {DbStore} from "./IpfsOrbitRepo"

export class DummyStore extends DbStore {
  private queryTest() {
    if (!this.store) { throw new Error("No this.store instance") }
    if (this.store.type === 'eventlog')      
      return (this.store as EventStore<string>).iterator({ limit: 5 }).collect()
    else if (this.store.type === 'feed')
      return (this.store as FeedStore<string>).iterator({ limit: 5 }).collect()
    else if (this.store.type === 'docstore')
      return (this.store as DocumentStore<string>).get('peer1')
    else if (this.store.type === 'keyvalue')
      return (this.store as KeyValueStore<string>).get('mykey')
    else if (this.store.type === 'counter')      
      return (this.store as CounterStore).value
    else
      throw new Error(`Unknown datatbase type:  ${this.store.type}`)

  }

   async queryAndRender(): Promise<void> {
    if (!this.store) { throw new Error("No this.store instance") }
    const networkPeers = await this.ipfs.swarm.peers()
    const databasePeers = await this.ipfs.pubsub.peers(this.store.address.toString())

    const result = this.queryTest()
    const statusToReport = {
      storeType: this.storeType, storeAddress: this.storeAddress, orbitid: this.orbitdb.id,
      databasePerNetwork: databasePeers.length / networkPeers.length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      oplogUpper: Math.max((this.store as any)._replicationStatus.progress, (this.store as any)._oplog.length),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      oplogLower: (this.store as any)._replicationStatus.max,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result: (result as string[]).slice().reverse().map((e: any) => e.payload.value)
    }

    this.statusFnc({ queryData: statusToReport, status: "", newData: true  });
  }
}
