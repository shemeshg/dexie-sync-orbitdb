import {DbStore} from "./IpfsOrbitRepo"

export class DummyStore extends DbStore {
  private queryTest() {
    if (!this.store) { throw new Error("No this.store instance") }
    if (this.store.type === 'eventlog')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (this.store as any).iterator({ limit: 5 }).collect()
    else if (this.store.type === 'feed')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (this.store as any).iterator({ limit: 5 }).collect()
    else if (this.store.type === 'docstore')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (this.store as any).get('peer1')
    else if (this.store.type === 'keyvalue')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (this.store as any).get('mykey')
    else if (this.store.type === 'counter')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (this.store as any).value
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
      result: result.slice().reverse().map((e: any) => e.payload.value)
    }

    this.statusFnc({ queryData: statusToReport, status: "", newData: true  });
  }
}
