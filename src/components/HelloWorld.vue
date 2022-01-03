<template>
  <div class="hello">
    <a
      href="https://github.com/orbitdb/orbit-db"
      class="github-corner"
      aria-label="View source on Github"
    />

    <div id="logo">
      <pre>
                 _     _ _         _ _     
                | |   (_) |       | | |    
       ___  _ __| |__  _| |_    __| | |__  
      / _ \| '__| '_ \| | __|  / _\` | '_\ 
     | (_) | |  | |_) | | |_  | (_| | |_) |
      \___/|_|  |_.__/|_|\__|  \__,_|_.__/ 

     Peer-to-Peer Database for the Decentralized Web
     <a href="https://github.com/orbitdb/orbit-db" target="_blank">https://github.com/orbitdb/orbit-db</a>
      </pre>
    </div>
    <p>It might help to locally<br/> ipfs daemon --enable-pubsub-experiment</p>
    
    <h2>Open or Create Local Database</h2>
    <i>Open a database locally and create it if the database doesn't exist.</i>
    <br /><br />
    <input v-model="dbname" type="text" placeholder="Database name" />
    <button @click="createDb" type="button" :disabled="isCreateDbDisabled">
      Open
    </button>
    <select v-model="dbType">
      <option value="eventlog">Eventlog</option>
      <option value="feed">Feed</option>
      <option value="keyvalue">Key-Value</option>
      <option value="docstore">DocumentDB</option>
      <option value="counter">Counter</option>
    </select>
    <input v-model="isDbPublic" type="checkbox" /> Public

    <h2>Open Remote Database</h2>
    <i
      >Open a database from an OrbitDB address, eg.
      /orbitdb/QmfY3udPcWUD5NREjrUV351Cia7q4DXNcfyRLJzUPL3wPD/hello</i
    >
    <br />
    <i
      ><b>Note!</b> Open the remote database in an Incognito Window or in a
      different browser. It won't work if you don't.</i
    >
    <br /><br />
    <input v-model="dbaddress" type="text" placeholder="Address" />
    <button @click="openDb" type="button" :disabled="isOpenDbDisabled">
      Open
    </button>
    <input v-model="isOpenReadOnly" type="checkbox" /> Read-only <br /><br />
    <div>{{ status }}</div>
    <div>
      <header id="output-header">{{ outputHeaderElmText }}</header>
      <h2 id="output">{{ outputElmText }}</h2>
    </div>
    <p v-for="(item, idx) in writerText" v-bind:key="idx">{{ item }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, Ref } from "vue";
import { ipfsRepo } from "./IpfsOrbitRepo";
import { DummyStore } from "./DummyStore";
import { IntevalSchedualer } from "./IntevalSchedualer";

export default defineComponent({
  name: "HelloWorld",
  props: {
    msg: String,
  },
  setup() {
    const outputHeaderElmText = ref("");
    const outputElmText = ref("");
    const writerText: Ref<string[]> = ref([]);

    const status = ref("Starting IPFS...");
    const dbname = ref("");
    const dbType = ref("eventlog");
    const isDbPublic = ref(true);
    const isCreateDbDisabled = ref(true);
    const isOpenDbDisabled = ref(true);
    const isOpenReadOnly = ref(true);

    const callbackFunction = (s: unknown) => {
      // eslint-disable-next-line
      const anyS = s as any;

      
      if (anyS.newData) {
        writerText.value.splice(0, writerText.value.length);
        anyS.queryData.result.forEach((e: string) => {
          writerText.value.push(e);
        });
      } else {
        status.value = anyS.status;
      }
      console.log(s);
    };

    let intevalSchedualer: IntevalSchedualer;
    const createDb = async () => {
      isCreateDbDisabled.value = true;
      isOpenDbDisabled.value = true;

      outputHeaderElmText.value = "";
      outputElmText.value = "";
      writerText.value = [];

      if (intevalSchedualer) {
        intevalSchedualer.stop();
      }

      const dbstore = new DummyStore(ipfsRepo, callbackFunction);
      await dbstore.createStore(dbname.value, dbType.value, isDbPublic.value);

      status.value = "Store created";
      await dbstore.loadStore();
      status.value = "Store loaded";
      intevalSchedualer = new IntevalSchedualer(dbstore);
      intevalSchedualer.start();
      status.value = "intevalSchedualer storing dummy data";
      outputHeaderElmText.value = `${dbstore.storeType} created`;
      outputElmText.value = `Try openning ${dbstore.storeAddress} from Incognito window ot other browser`;

      isCreateDbDisabled.value = false;
      isOpenDbDisabled.value = false;
    };

    const dbaddress = ref("");
    const openDb = async () => {
      isCreateDbDisabled.value = true;
      isOpenDbDisabled.value = true;

      outputHeaderElmText.value = "";
      outputElmText.value = "";
      writerText.value = [];

      if (intevalSchedualer) {
        intevalSchedualer.stop();
      }
      const dbstore = new DummyStore(ipfsRepo, callbackFunction);
      await dbstore.openStore(dbaddress.value);
      status.value = "Store created";
      await dbstore.loadStore();
      status.value = "Store loaded";
      if (isOpenReadOnly.value) {
        status.value = "Listening for remote data";
      } else {
        intevalSchedualer = new IntevalSchedualer(dbstore);
        intevalSchedualer.start();
        status.value = "intevalSchedualer storing dummy data";
      }

      outputHeaderElmText.value = `${dbstore.storeType} opened`;
      outputElmText.value = `Compare this window to the window where Db was created`;

      isCreateDbDisabled.value = false;
      isOpenDbDisabled.value = false;
    };

    const doOnMounted = async () => {
      await ipfsRepo.doConnect();
      isCreateDbDisabled.value = false;
      isOpenDbDisabled.value = false;
      status.value = "IPFS Started";
    };
    onMounted(doOnMounted);

    return {
      dbname,
      createDb,
      dbType,
      isDbPublic,
      isCreateDbDisabled,
      openDb,
      isOpenDbDisabled,
      isOpenReadOnly,
      status,
      outputHeaderElmText,
      outputElmText,
      writerText,
      dbaddress,
    };
  },
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.hello {
  font-family: "Abel", sans-serif;
  font-size: 0.8em;
}

#logo {
  border-top: 1px dotted black;
  border-bottom: 1px dotted black;
}

#status {
  border-top: 1px dotted black;
  border-bottom: 1px dotted black;
  padding: 0.5em 0em;
  text-align: center;
}

#results {
  border: 1px dotted black;
  padding: 0.5em;
}

#output-header > p {
  margin: 0;
  font-style: italic;
}

#output {
  padding-top: 1em;
}

#writerText {
  padding-top: 0.5em;
}

pre {
  text-align: center;
}

input {
  padding: 0.5em;
}

h2 {
  margin-bottom: 0.2em;
}
h3 {
  margin-top: 0.8em;
  margin-bottom: 0.2em;
}
</style>
