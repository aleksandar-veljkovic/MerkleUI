import React, { createContext, useEffect, useState, useRef } from "react";
import { ethers } from "ethers";
import merkleTreeAbi from "./merkle-tree-abi.json";
import { groth16 } from "snarkjs";
import BigInt from "big-integer";

export const MerkleTreeContext = createContext();

function unstringifyBigInts(o) {
    if ((typeof(o) == "string") && (/^[0-9]+$/.test(o) ))  {
        return BigInt(o);
    } else if ((typeof(o) == "string") && (/^0x[0-9a-fA-F]+$/.test(o) ))  {
        return BigInt(o);
    } else if (Array.isArray(o)) {
        return o.map(unstringifyBigInts);
    } else if (typeof o == "object") {
        if (o===null) return null;
        const res = {};
        const keys = Object.keys(o);
        keys.forEach( (k) => {
            res[k] = unstringifyBigInts(o[k]);
        });
        return res;
    } else {
        return o;
    }
}

const MerkleTreeContextProvider = ({ children }) => {
    const [nodes, setNodes] = useState([]);
    const [treeNodes, setTreeNodes] = useState({});
    const [root, setRoot] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isValidProof, setIsValidProof] = useState(null);
    const [isBusy, setIsBusy] = useState(false);

    const merkleTree = useRef(null);

    // Convert nodes to tree structure
    const nodesToTree = (nodes, currentIndex) => {
        const data = {
          name: `15:${nodes[14].toString()}`,
          children: [
            {
              name: `13:${nodes[12].toString()}}`,
              children: [
                {
                  name: `9:${nodes[8].toString()}`,
                  children: [
                    {
                      name: `1:${nodes[0].toString()}${ currentIndex == 0 ? ' <-- Current' : ''}`,
                    },
                    {
                      name: `2:${nodes[1].toString()}${ currentIndex == 1 ? ' <-- Current' : ''}`,
                    }
                  ]
                },
                {
                  name: `10:${nodes[9].toString()}`,
                  children: [
                    {
                      name: `3:${nodes[2].toString()}${ currentIndex == 2 ? ' <-- Current' : ''}`,
                    },
                    {
                      name: `4:${nodes[3].toString()}${ currentIndex == 3 ? ' <-- Current' : ''}`,
                    }
                  ]
                }
              ]
            },
            {
              name: `14:${nodes[13].toString()}`,
              children: [
                {
                  name: `11:${nodes[10].toString()}`,
                  children: [
                    {
                      name: `5:${nodes[4].toString()}${ currentIndex == 4 ? ' <-- Current' : ''}`,
                    },
                    {
                      name: `6:${nodes[5].toString()}${ currentIndex == 5 ? ' <-- Current' : ''}`,
                    }
                  ]
                },
                {
                  name: `12:${nodes[11].toString()}`,
                  children: [
                    {
                      name: `7:${nodes[6].toString()}${ currentIndex == 6 ? ' <-- Current' : ''}`,
                    },
                    {
                      name: `8:${nodes[7].toString()}${ currentIndex == 7 ? ' <-- Current' : ''}`,
                    }
                  ]
                }
              ]
            }
          ]
        };
    
        return data;
      }

    // Initialize connection with MerkleTree contract
    const init = async ({ merkleTreeAddress, privateKey, rpcString }) => {
        const provider = new ethers.providers.JsonRpcProvider(`${rpcString}`);
        const wallet = new ethers.Wallet(privateKey, provider);
        merkleTree.current = new ethers.Contract(merkleTreeAddress, merkleTreeAbi, wallet);

        if (!isLoaded) {
            await load();
        }
    }

    // Load current data stored in the contract
    const load = async () => {
        const index = await merkleTree.current.index();
        const root = await merkleTree.current.root();

        const nodes = []
        for (let i = 0; i < 15; i += 1) {
            nodes.push(await getNode(i));
        }

        setCurrentIndex(index);
        setNodes(nodes);
        setTreeNodes(nodesToTree(nodes, index));
        setRoot(root);
        setIsLoaded(true);
    }

    // Get hash value stored in the node with the given index
    const getNode = (index) => {
        return merkleTree.current.hashes(index);
    }

    // Insert new leaf hash
    const insertLeaf = async (value) => {
        if (!isLoaded) {
            throw new Error('MerkleTree not loaded!');
        }

        if (currentIndex == 7) {
            throw new Error('MerkleTree is full!');
        } 

        await merkleTree.current.insertLeaf(value);
        await load();
    }

    const createProof = async (leafIndex) => {
        if (leafIndex == null || `${leafIndex.trim()}`.length == 0) {
            window.alert('Invalid leaf index, index should be value from interval [1,8]');
            return;
        }

        let index = parseInt(leafIndex) - 1;
        let shiftedIndex = index

        if (index < 0 || index > 7) {
            window.alert('Invalid leaf index, index should be value from interval [1,8]');
            return;
        }

        setIsBusy(true);
        const elements = [];
        const path = [];
        
        let levelShift = 0;

        for (let i = 3; i > 0; i -= 1) {
            path.push(index % 2);

            if (index % 2 == 0) {
                elements.push(nodes[shiftedIndex + 1].toString());
            } else {
                elements.push(nodes[shiftedIndex - 1].toString());
            }

            levelShift += Math.pow(2, i);
            index = Math.floor(index / 2);
            shiftedIndex = levelShift + index;
        }
        

        const input = {
            "leaf": nodes[leafIndex - 1].toString(),
            "path_elements": elements,
            "path_index": path,
        };

        const { proof, publicSignals } = await groth16.fullProve(input, "circuits/circuit.wasm","circuits/circuit_final.zkey");

        const editedPublicSignals = unstringifyBigInts(publicSignals);
        const editedProof = unstringifyBigInts(proof);
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);
    
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x.split('0x')[1], 16).toString());
    
        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        const root = argv.slice(8);

        const verified = await merkleTree.current.verify(a, b, c, root);
        setIsValidProof(verified);
        setIsBusy(false);
    }

    useEffect(() => {
        load();
    }, [])

    return (
        <MerkleTreeContext.Provider value={{ 
            init, 
            nodes, 
            root, 
            currentIndex, 
            isLoaded, 
            insertLeaf, 
            treeNodes, 
            createProof,
            isValidProof,
            isBusy,
        }}>
            { children }
        </MerkleTreeContext.Provider>
    )
}

export default MerkleTreeContextProvider;