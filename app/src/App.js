import './App.css';

import { useEffect, useState } from 'react'
import {Connection, PublicKey, clusterApiUrl, Keypair, LAMPORTS_PER_SOL} from '@solana/web3.js'
import {
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import {
  Program,
  AnchorProvider,
  utils,
  BN,
  web3,
} from '@project-serum/anchor'
import idl from './new_presale.json'
import {Buffer} from 'buffer'
window.Buffer = Buffer

const {
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} = web3
const programId = new PublicKey(idl.metadata.address)
const network = clusterApiUrl('devnet')
const opts = {
  preflightCommitment: 'processed', // to be confirmed by whole network use finalized, this only is confirmed by node
}


function App() {
  const [walletAddress, setWalletAddress] = useState(null)
  const getProvider = ()=>{
    const connection = new Connection(network, opts.preflightCommitment)
    const provider = new AnchorProvider(connection, window.solana, opts.preflightCommitment)
    return [provider, connection]
  }

  const checkIfWalletIsConnected = async () => {
    try {
      const {solana} = window
      if(solana){
        if(solana.isPhantom) console.log('Phantom wallet found')
        const response = await solana.connect({
          onlyIfTrusted: true
        })
        console.log('Connected with public key: ', response.publicKey.toString())
        setWalletAddress(response.publicKey.toString())
      }else alert('Install phantom wallet')
    } catch (error) {
      console.log(error)
    }
  }
  const connectWallet = async()=>{
    const {solana} = window
    if(solana){
      const response = await solana.connect()
      console.log('Connected with public key: ', response.publicKey.toString())
      setWalletAddress(response.publicKey.toString())
    }
  }

  const createIcoATA = async()=>{
    try {
      const [provider, connection] = getProvider()
      const program = new Program(idl, programId, provider)
      // Initialize accounts
      const adminAccount = Keypair.fromSecretKey(Buffer.from([148,136,143,183,68,112,180,214,200,27,96,58,214,204,216,28,91,226,247,70,196,123,102,217,229,129,111,96,239,76,25,54,127,208,185,41,168,64,97,15,29,50,207,241,25,9,95,138,187,29,207,70,232,166,108,176,251,38,141,225,115,6,110,216], 'base64'))
      console.log(adminAccount.publicKey.toString())
      const systemProgram = new PublicKey(SystemProgram.programId);
      console.log(systemProgram.toString())
      const tokenMintId = new PublicKey('Wpmdtahg9TSfPRD465P4TdncXrJo53EMyKkvaBqCtRm');
      const adminTokenAccount = new PublicKey('7Tmea8uDq2B3PSZ3aLL1AGfQ3fk2rNJgs1RPj8RrdfT8');
      
      // console.log(dataAccount.publicKey.toString(), dataAccount)
      const [icoAtaForIcoProgram] = PublicKey.findProgramAddressSync(
        [
          tokenMintId.toBuffer(), // Convert token mint address to buffer
        ],
        program.programId
      )
      console.log(icoAtaForIcoProgram.toString())
      const [data] = PublicKey.findProgramAddressSync(
        [
          utils.bytes.utf8.encode('data'),
          adminAccount.publicKey.toBuffer()
        ],
        program.programId
      )
      console.log(data.toString())

      console.log(TOKEN_PROGRAM_ID.toString())

      // // Sign and send the transaction
      await program.rpc.createIcoAta(new BN(500000000), new BN(1*LAMPORTS_PER_SOL), new BN(10*LAMPORTS_PER_SOL), {
        accounts: {
          icoAtaForIcoProgram,
          data,
          icoMint: tokenMintId,
          icoAtaForAdmin: adminTokenAccount,
          admin: adminAccount.publicKey,
          systemProgram,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [adminAccount],
      });

      console.log('ICO ATA created successfully!');
    } catch (error) {
      console.error('Error creating ICO ATA:', error)
    }
  }

  const depositIcoInATA = async() =>{
    try {
      const [provider, connection] = getProvider()
      const program = new Program(idl, programId, provider)
      
      const adminAccount = Keypair.fromSecretKey(Buffer.from([148,136,143,183,68,112,180,214,200,27,96,58,214,204,216,28,91,226,247,70,196,123,102,217,229,129,111,96,239,76,25,54,127,208,185,41,168,64,97,15,29,50,207,241,25,9,95,138,187,29,207,70,232,166,108,176,251,38,141,225,115,6,110,216], 'base64'))
      const adminTokenAccount = new PublicKey('7Tmea8uDq2B3PSZ3aLL1AGfQ3fk2rNJgs1RPj8RrdfT8');
      const tokenMintId = new PublicKey('Wpmdtahg9TSfPRD465P4TdncXrJo53EMyKkvaBqCtRm');
      
      const [data] = PublicKey.findProgramAddressSync(
        [
          utils.bytes.utf8.encode('data'),
          adminAccount.publicKey.toBuffer()
        ],
        program.programId
      )
      const [icoAtaForIcoProgram] = PublicKey.findProgramAddressSync(
        [
          tokenMintId.toBuffer(), // Convert token mint address to buffer
        ],
        program.programId
      )
      // Sign and send the transaction
      await program.rpc.depositIcoInAta(new BN(1000000000), {
        accounts: {
          icoAtaForIcoProgram,
          data,
          icoMint: tokenMintId,
          icoAtaForAdmin: adminTokenAccount,
          admin: adminAccount.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [adminAccount],
      });

      console.log(`Deposited ${1000000000} FZI in program ATA.`);
    } catch (error) {
      console.error('Error depositing:', error)
    }
  }

  const startSale = async()=>{
    try {
      const [provider, connection] = getProvider()
      const program = new Program(idl, programId, provider)
      const systemProgram = new PublicKey(SystemProgram.programId);
      const adminAccount = Keypair.fromSecretKey(Buffer.from([148,136,143,183,68,112,180,214,200,27,96,58,214,204,216,28,91,226,247,70,196,123,102,217,229,129,111,96,239,76,25,54,127,208,185,41,168,64,97,15,29,50,207,241,25,9,95,138,187,29,207,70,232,166,108,176,251,38,141,225,115,6,110,216], 'base64'))
      const [data] = PublicKey.findProgramAddressSync(
        [
          utils.bytes.utf8.encode('data'),
          adminAccount.publicKey.toBuffer()
        ],
        program.programId
      )
      // Sign and send the transaction
      await program.rpc.startSale({
        accounts: {
          data,
          admin: adminAccount.publicKey,
          systemProgram
        },
        signers: [adminAccount],
      });
      // data info fetch
      const dataAccount = await program.account.data.fetch(data)
      console.log(dataAccount.isActive)

      console.log("Sale is now active.");
    } catch (error) {
      console.error('Error starting a sale:', error)
    }
  }

  const buyWithSol = async()=>{
    try {
      const [provider, connection] = getProvider()
      const program = new Program(idl, programId, provider)
      const systemProgram = new PublicKey(SystemProgram.programId);
      
      const adminAccount = Keypair.fromSecretKey(Buffer.from([148,136,143,183,68,112,180,214,200,27,96,58,214,204,216,28,91,226,247,70,196,123,102,217,229,129,111,96,239,76,25,54,127,208,185,41,168,64,97,15,29,50,207,241,25,9,95,138,187,29,207,70,232,166,108,176,251,38,141,225,115,6,110,216], 'base64'))
      const tokenMintId = new PublicKey('Wpmdtahg9TSfPRD465P4TdncXrJo53EMyKkvaBqCtRm');
      const icoAtaForUser = await createAssociatedTokenAccount(connection, adminAccount, tokenMintId, provider.wallet.publicKey)
      
      const [icoAtaForIcoProgram, bump] = PublicKey.findProgramAddressSync(
        [
          tokenMintId.toBuffer(), // Convert token mint address to buffer
        ],
        program.programId
      )
      const [data] = PublicKey.findProgramAddressSync(
        [
          utils.bytes.utf8.encode('data'),
          adminAccount.publicKey.toBuffer()
        ],
        program.programId
      )
      // Sign and send the transaction
      await program.rpc.buyWithSol(bump, new BN(1), {
        accounts: {
          icoAtaForIcoProgram,
          data,
          icoMint: tokenMintId,
          icoAtaForUser,
          user: provider.wallet.publicKey,
          admin: adminAccount.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram
        },
      });

      console.log(`Purchased tokens with ${1} SOL.`);
    } catch (error) {
      console.error('Error buying:', error)
    }
  }

  const renderNotConnectedContainer = () => {
    return (<button onClick={connectWallet}>Connect to Wallet</button>)
  }
  const renderConnectedContainer = () => {
    return (
      <>
        <p>Wallet Connected: {walletAddress}</p>
        <button onClick={createIcoATA}>Create ICO ata</button>
        <button onClick={depositIcoInATA}>Deposit to ICO ATA</button>
        <button onClick={startSale}>Start Sale</button>
        <button onClick={buyWithSol}>Buy with SOL</button>
      </>
    )
  }
  useEffect(()=>{
    const onLoad = async()=>{
      await checkIfWalletIsConnected()
    }
    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  },[])
  return (
    <div className="App">
      {!walletAddress && renderNotConnectedContainer()}
      {walletAddress && renderConnectedContainer()}
    </div>
  );
}

export default App;
