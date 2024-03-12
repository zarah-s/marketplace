exports.checkProductPaymentTransactionValidity = (sender,balanceOf,products,productId) => {
    const product = products.find(product => product.id === productId);
    if(!product){
        return {success:false, msg:"PRODUCT_NOT_FOUND",product}
    }else{

        if((balanceOf[sender]??0)<product.price){
            return {success:false,msg:"INSUFFICIENT_BALANCE",product};
        }else{
            return {success:true,msg:"",product}
        }
    }
}


exports.checkReleaseFundsTransactionValidity = (sender,transactions,transactionId) => {
    const transaction = transactions.find(tx => tx.id === transactionId);
    if(!transaction){
        return {success:false, msg:"TRANSACTION_NOT_FOUND",transaction}
    }else if(transaction.to!==sender){
        return {success:false,msg:"INVALID INITIATOR",transaction};
    }else{
            return {success:true,msg:"",transaction}
        
    }
}



exports.checkCreateProductTransactionValidity = (data) => {
    if(!data.title){
        return {success:false,msg:"INVALID_TITLE"}
    }else if(!data.price){
        return {success:false,msg:"INVALID_PRICE"}

    }else if(!data.description){
        return {success:false,msg:"INVALID_DESCRIPTION"}

    }
   else if(!data.image){
        return {success:false,msg:"INVALID_IMAGE"}

    }else{
        return {success:true,msg:""}
    }
}