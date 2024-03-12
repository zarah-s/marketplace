// XXX even though ethers is not used in the code below, it's very likely
// it will be used by any DApp, so we are already including it here
const { ethers } = require("ethers");
const { stringToHex } = require("./helpers/helpers");
const methods = require("./methods");
const {checkProductPaymentTransactionValidity,checkReleaseFundsTransactionValidity,checkCreateProductTransactionValidity} = require("./checks")

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);

const owner = "0x42AcD393442A1021f01C796A23901F3852e89Ff3";
let transactions = [];
let balanceOf = {
  [owner]:1000000000*10e18
};
let allowance = {};
let products = [];
let stakes = []

const emitReport = async (e) => {
  await fetch(rollup_server + "/report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      payload: stringToHex(JSON.stringify({ error: e })),
    }),
  });
  return "reject";
}


const emitNotice = async (data) => {
  const hexresult = stringToHex(data);
  const advance_req = await fetch(rollup_server + "/notice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload: hexresult }),
  });
  return advance_req;
}


async function handle_advance(data) {

 const payload = data.payload;
  let JSONpayload = {};
  const payloadStr = ethers.toUtf8String(payload);
  JSONpayload = JSON.parse(payloadStr);

  console.log("PAYLOAD========>>", payloadStr)
  console.log("------------------------------------------")

  const sender = data.metadata.msg_sender;

  switch (JSONpayload.method) {
    case methods.DEPOSIT:
      const checks = checkProductPaymentTransactionValidity(sender,balanceOf,products,JSONpayload.productId)
    if(checks.success){
      balanceOf[sender] = balanceOf[sender]-checks.product.price;
      balanceOf[owner] = balanceOf[owner]+checks.product.price;
      const transaction = {
        from: product.owner,
        to:sender,
        id:transactions.length,
        amount:checks.product.price,
        productId:checks.product.id,
        fulfiled:false,
        
      }
      transactions.push(transaction);
            await emitNotice({ state: "transactions", data: transactions })
            await emitNotice({ state: "balances", data: balanceOf })

    }else{
     await emitReport(checks)
    }
      
      break;

    case methods.RELEASE:
      const checks = checkReleaseFundsTransactionValidity(sender,transactions,JSONpayload.transactionId);
      if(checks.success){
balanceOf[checks.transaction.from] = balanceOf[checks.transaction.from]+ checks.transaction.amount;
balanceOf[owner] = balanceOf[owner]- checks.transaction.amount;
transactions[checks.transaction.id] = {
  ...transactions[checks.transaction.id],
  fulfiled:true
}

 await emitNotice({ state: "transactions", data: transactions })
            await emitNotice({ state: "balances", data: balanceOf })


      }else{
        await emitReport(checks)
      }
      break;

    case methods.ADD_PRODUCT:
      const checks = checkCreateProductTransactionValidity(JSONpayload);
     if(checks.success){
       const jsonData = {
        ...JSONpayload,
        method:undefined,
        owner:sender,
        id:products.length
      }

      products.push(jsonData)
            await emitNotice({ state: "products", data: products })

     }else{
      await emitReport(checks)
     }


      break;

  
    default:
      break;
  }


  console.log("Received advance request data " + JSON.stringify(data));
  return "accept";
}

async function handle_inspect(data) {
  console.log("Received inspect request data " + JSON.stringify(data));
  return "accept";
}

var handlers = {
  advance_state: handle_advance,
  inspect_state: handle_inspect,
};

var finish = { status: "accept" };

(async () => {
  while (true) {
    const finish_req = await fetch(rollup_server + "/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "accept" }),
    });

    console.log("Received finish status " + finish_req.status);

    if (finish_req.status == 202) {
      console.log("No pending rollup request, trying again");
    } else {
      const rollup_req = await finish_req.json();
      var handler = handlers[rollup_req["request_type"]];
      finish["status"] = await handler(rollup_req["data"]);
    }
  }
})();
