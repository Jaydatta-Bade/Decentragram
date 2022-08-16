import Decentragram from '../abis/Decentragram.json'
import React, { Component } from 'react';
import Identicon from 'identicon.js';
import Navbar from './Navbar'
import Main from './Main'
import Web3 from 'web3';
import './App.css';
// import  create  from 'ipfs-http-client'
// const NFTStorage = require('nft.storage')
import {NFTStorage, Blob} from 'nft.storage/dist/bundle.esm.min.js'





//Declare IPFS
// const ipfsClient = require('ipfs-http-client')
// const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https', headers: {
//   authorization: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDFhNWNiQTlFYkQwRTcxZWE4NTA0Zjk5NGE0MkNBOUE3MWRlQTkwZTAiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY2MDM5NDEyMjQxOSwibmFtZSI6IkRUd2l0dGVyLTEifQ.0N-3jYVHOy1etZJxQ9jSm_Pk34h9RVmTpSSO2H_XnX0',
// }, }) // leaving out the arguments will default to these values
let NFT_STORAGE_TOKEN='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDFhNWNiQTlFYkQwRTcxZWE4NTA0Zjk5NGE0MkNBOUE3MWRlQTkwZTAiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY2MDM5NDEyMjQxOSwibmFtZSI6IkRUd2l0dGVyLTEifQ.0N-3jYVHOy1etZJxQ9jSm_Pk34h9RVmTpSSO2H_XnX0'
const IPFS=require('ipfs-http-client');
const create=require('ipfs-http-client');
// var client = create('https://ipfs.infura.io:5001/api/v0');
// var client = create(' https://ipfs.infura.io:5001/api/v0/add?params');
const client = new NFTStorage({ token: NFT_STORAGE_TOKEN })


// const ipfs=new IPFS({host:'ipfs.infura.io',port:5001,protocol:'https',apiPath: '/ipfs/api/v0'});
const ipfs =new IPFS({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'http',
  apiPath:'/ipfs/api/v0'
})


class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3
    // Load account
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
    // Network ID
    const networkId = await web3.eth.net.getId()
    const networkData = Decentragram.networks[networkId]
    // if(networkData) {
      const m = true
    if(m) {
      // const decentragram = new web3.eth.Contract(Decentragram.abi, networkData.address)
      const decentragram = new web3.eth.Contract(Decentragram.abi, '0x2E0C4D0468Fc9516DEAad8436F86960E8eCC3aa1')
      this.setState({ decentragram })
      const imagesCount = await decentragram.methods.imageCount().call()
      this.setState({ imagesCount })
      console.log("imagecount", imagesCount)
      // Load images
      for (var i = 1; i <= imagesCount; i++) {
        const image = await decentragram.methods.images(i).call()
        console.log("images is:-",image)
        this.setState({
          images: [...this.state.images, image]
        })
      }
      // Sort images. Show highest tipped images first
      this.setState({
        images: this.state.images.sort((a,b) => b.tipAmount - a.tipAmount )
      })
      this.setState({ loading: false})
    } else {
      window.alert('Decentragram contract not deployed to detected network.')
    }
  }

  captureFile = event => {

    event.preventDefault()
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)

    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) })
      console.log('buffer', this.state.buffer)
    }
  }

  uploadImage =async description => {
    console.log("Submitting file to ipfs...")
    const someData = new Blob([this.state.buffer])
    const cid = await client.storeBlob(someData)
    console.log("CId:- ", cid)
    console.log("buffer crearted")
    //adding file to the IPFS
    // await client.storeBlob(
    //   // this.state.buffer, (error, result) => {
    //     someData, (error, result) => {
    //     console.log('entered into the page')
    //   console.log('Ipfs result', result)
    //   if(error) {
    //     console.error(error)
    //     return
    //   }

      this.setState({ loading: true })
      // this.state.decentragram.methods.uploadImage(result[0].hash, description).send({ from: this.state.account }).on('transactionHash', (hash) => {
      this.state.decentragram.methods.uploadImage(cid, description).send({ from: this.state.account }).on('transactionHash', (hash) => {
        this.setState({ loading: false })
      })
    
  };

  tipImageOwner(id, tipAmount) {
    this.setState({ loading: true })
    this.state.decentragram.methods.tipImageOwner(id).send({ from: this.state.account, value: tipAmount }).on('transactionHash', (hash) => {
      this.setState({ loading: false })
    })
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      decentragram: null,
      images: [],
      loading: true
    }

    this.uploadImage = this.uploadImage.bind(this)
    this.tipImageOwner = this.tipImageOwner.bind(this)
    this.captureFile = this.captureFile.bind(this)
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main
              images={this.state.images}
              captureFile={this.captureFile}
              uploadImage={this.uploadImage}
              tipImageOwner={this.tipImageOwner}
            />
        }
      </div>
    );
  }
}

export default App;