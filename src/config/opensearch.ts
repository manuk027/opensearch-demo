import { Client } from "@opensearch-project/opensearch";

const openSearchClient = new Client({
  node: "http://localhost:9200",
});

export default openSearchClient;