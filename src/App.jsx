import React, { useEffect, useState } from "react";
import { ethers } from "ethers"; //ethers is library helping front end talk to contract
import "./App.css";
import abi from "./utils/ResourcePortal.json"
import twitterLogo from './assets/twitter-logo.svg';


const TWITTER_HANDLE = 'kkamalva';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  //create variable that holds contract address after it is deployed
  //All state property to store all waves
  const [allResources, setAllResources] = useState([]);
  const [message, setMessage] = useState("");
  const [resourceCount, setResourceCount] = useState();
  const [resourceAddress, setResourceAddress] = useState();
  const [isConnecting, setConnecting] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [isMining, setMining] = useState(false);
  const [isHTTP, setIsHTTP] = useState(false);

  const contractAddress = "0xC125570C41Dd322f7Ea68A40e7630EF2729b8018";

  //first import json file, then we need variable abi
  const contractABI = abi.abi

  const refreshPage = async() => {
    window.location.reload(false);
  }

  
  useEffect(() => {
      checkIfWalletIsConnected();
      getAllResources();
    }, [])
    

  useEffect(() => {
    let resourcePortalContract;

    const onNewResource = (from, timestamp, message, hasHTTP) => {
      console.log("NewResource", from, timestamp, message, hasHTTP);
      //
      setAllResources(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
          hasHTTP: (message.substring(0,4)=='http')
        },
      ]);
      getAllResources();
    };
    

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      //resourcePortalContract = new ethers.providers.Web3Provider(window.ethereum);

      resourcePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      resourcePortalContract.on("NewResource", onNewResource);
    }

    return () => {
      if (resourcePortalContract) {
        resourcePortalContract.off("NewResource", onNewResource);
      }
    };
  }, []);
    
  const getAllResources = async () => {
    const { ethereum } = window;

    try{
      
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const resourcePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        //Call getAllResources method from smart contract
        const resources = await resourcePortalContract.getAllResources();

        //Only need address, timestamp, and message in UI

        let resourcesCleaned = [];
        setIsHTTP(false);
        resources.forEach(resource => {
          resourcesCleaned.push({
          address: resource.resourcer,
          timestamp: new Date(resource.timestamp * 1000),
          message: resource.message,
          hasHTTP: (resource.message.substring(0,4)=='http')

          });

        });
        
        console.log('Got Resourceses', resourcesCleaned)
        setAllResources(resourcesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };


  

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask (https://metamask.io/download/)");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask (https://metamask.io/download/)");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const resource = async () => {
    setConnecting(true);
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        //provider-where we talk to ethereum nodes
        //used alchemy to deploy nodes in hardhatconfig.js
        //use nodes that Metamask provids to send/receive data from deployed contract
        const signer = provider.getSigner();
        // signer is used to sign messages and transactions and send signed transactions to Ethereum Network to execute state changing operations
        const resourcePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        //ABI is found in artifacts when contract is compiled
        //Application Binary Interface-tells frontend how to interect with smart contract
        
        let count = await resourcePortalContract.getTotalResources();
        console.log("Retrieved total resource count... ", count.toNumber());       
        

        /*
        * Execute actual resource from smart contract
        */
        const resourceTxn = await resourcePortalContract.resource(message, { gasLimit: 300000 });
        setMessage("")
        console.log("Mining...", resourceTxn.hash);
        setConnecting(false);
        setMining(true);

        await resourceTxn.wait();

        console.log("Mined -- ", resourceTxn.hash);
        setMining(false);
        setLoading(true);


        count = await resourcePortalContract.getTotalResources();
        console.log("Retrieved total resource count...", count.toNumber());
        setResourceCount(count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
    
    setLoading(false);

  }
  //{currentAccount && (
  //  <div className="resourceCountText">Links Dropped: <b>{resourceCount}</b></div>
    
  //)}

  





  return (
    <div className = "App">
    
    

      <div className="mainContainer">
      
        <div className="dataContainer">
        

          <div className="header">
          👋 Hey, It's KK!
          </div>

          <div className="bio">
            Connect your Ethereum wallet and drop a link to your favorite web3 project.
          </div>
          

          {!currentAccount && (
            <button className="resourceButton" onClick={connectWallet}> Connect Wallet
            </button>
          )}


          {currentAccount && (
              <div className="resourceCountText"> You are now connected to your wallet: {currentAccount}</div>
              //<div>{currentAccount}</div>
          )}
          
          {currentAccount && (
              <div className="app__inputContainer">
                <input value={message} onChange={(e) => setMessage(e.target.value)} className="app__input" placeholder="Type Link..."/>
            </div>
          )}
            
          
          {currentAccount && (    
            <button className="resourceButton" onClick={resource}>
              Drop Link
              
            </button>
            
          )}


          

          {isLoading && (
              <div className="resourceCountText">Loading...
            </div>
          )}

          {isMining && (
              <div className="resourceCountText">Mining...
            </div>
          )}
        
          {allResources.slice(0).reverse().map((resource, index) => {
            return (
              <div key ={index} style={{color: "black", backgroundColor: "OldLace", marginTop: "16px", padding: "10px"}}>
                <div className> Address:
                  <a href = {"https://rinkeby.etherscan.io/address/"+resource.address} target="_blank" rel="noopener noreferrer"> {resource.address} </a>
                  
                </div>
                <div className> Time: {resource.timestamp.toString()}</div>
                <div className> Link:
                {resource.hasHTTP && (
                    <a href = {resource.message} target="_blank" rel="noopener noreferrer"> {resource.message} </a>
                )}
                {!resource.hasHTTP && (
                    <a href = {"https://"+resource.message} target="_blank" rel="noopener noreferrer"> {resource.message} </a>
                )}
                  
                </div>
              </div>)
          })}
          </div>


          
          
                 

          
          
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
        
        
        
      </div>
      
      
      

  );
}

export default App