// eslint-disable-next-line
import { createRef, useContext, useEffect, useRef, useState } from 'react';
import { Tree } from 'react-tree-graph';
import { MerkleTreeContext } from './contexts/merkle-tree-context';
import config from './config';
import './App.css';
import 'react-tree-graph/dist/style.css'

function App() {
  const { 
    init, 
    isLoaded, 
    treeNodes, 
    currentIndex, 
    insertLeaf, 
    createProof,
    isBusy,
    isValidProof,
  } = useContext(MerkleTreeContext);

  const inputRef = createRef();
  const leafIndexInputRef = createRef();
  const leafValueInputRef = createRef();

  useEffect(() => {
    init(config);
  }, [])

  const addLeaf = () => {
    const { value } = inputRef.current;

    if (value != null && value.trim().length > 0) {
      insertLeaf(parseInt(value))
      inputRef.current.value = null;
    }
  }

  return (
    <div className="App">
      <header>
        <h1>MerkleUI</h1>
      </header>
      <div>
        { !isLoaded ? 
          <p>Loading MerkleTree Smart Contract...</p> 
        :
          <div className="leaves">
            <div>
              {
                currentIndex < 8 ?
                  <>
                    <p>Add new leaf:</p>
                    <input 
                      ref={inputRef}
                      type="number" 
                      placeholder='New leaf value'
                    ></input>
                    <button onClick={() => addLeaf()}>Add</button>
                  </>
                :
                  <p>The tree is full:</p>
              }

                    <p>Create and check proof:</p>
                    <input 
                      ref={leafIndexInputRef}
                      type="number"
                      placeholder='leaf index'
                      min={1}
                      max={8}
                      step={1}
                      style={{ width: 100 }}
                    ></input>
                    <button 
                      disabled={isBusy} 
                      onClick={() => createProof(leafIndexInputRef.current.value.trim())}
                    >{ isBusy ? 'Generating proof' : 'Create and Verify' }</button>
                    { isValidProof != null &&
                      <p>
                        { isValidProof ?
                          'The proof is valid!'
                          :
                          'The proof is not valid!'
                        }
                      </p>
                    }
            </div>

            <Tree
              key={Math.random()}
              data={treeNodes}
              height={600}
              width={1200}
            />
          </div>
        }
      </div>
    </div>
  );
}

export default App;
