import env from "react-dotenv";

const config = {
    merkleTreeAddress: env.MERKLE_TREE_ADDRESS,
    privateKey: env.PRIVATE_KEY,
    rpcString: env.RPC_STRING
};

export default config;