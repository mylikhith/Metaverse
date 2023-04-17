import Land from "./abi/abi.json";
import Web3 from "web3";

const polygon = new Promise((res, rej) => {
  async function meta() {
    if (typeof window.ethereum == "undefined") {
      rej("you should install Metamask");
    }

    let web3 = new Web3(window.ethereum);
    let contract = new web3.eth.Contract(
      Land.abi,
      "0x83347dB3EE32E2179011C740cE4741119828b527"
    );

    let accounts = await web3.eth.requestAccounts();
    console.log("connected account ", accounts[0]);

    let totalSupply = await contract.methods
      .totalSupply()
      .call({ from: accounts[0] });
    console.log("total supply ", totalSupply);
    let maxSupply = await contract.methods
      .maxSupply()
      .call({ from: accounts[0] });
    console.log("max supply ", maxSupply);

    let buildings = await contract.methods
      .getBuildings()
      .call({ from: accounts[0] });
    console.log("Buildings ", buildings);
    // console.log("Farm house ", buildings[0]);

    web3.eth.requestAccounts().then((accounts)=>{
        contract.methods.totalSupply().call({from:accounts[0]}).then((supply)=>{
            contract.methods.getBuildings().call({from:accounts[0]}).then((data)=>{
                res({supply:supply, nft:data})
            })
        })
    });
  }
  meta();
});

export default polygon;