const mongoose = require("mongoose");
const currencyModel = require("../models/currencyModel");
const tradeModel = require("../models/tradeModel");
const ObjectId = require("mongodb").ObjectId;
const userModel = require("../models/userModel")
const sendNotification = require('../utils/pushNotification')
const notificationModel = require("../models/notificationModel");


exports.createTrade = async (req,res)=>{
    try{
        const date = req.body.date;
        let addedBy = req.body.addedBy;
        let trade_type = req.body.trade_type;
        let currency1_id= req.body.currency1_id;
        let currency2_id= req.body.currency2_id;
        const buy_price= req.body.buy_price;
        const current_price= req.body.current_price;
        const pips = req.body.pips;
        var notificationDetail ={
            notificationSendStatus:"",
            notificationStoringStatus:""

        }

      
        const currency1_details = await currencyModel.findOne({_id:currency1_id});
        const currency2_details = await currencyModel.findOne({_id:currency2_id});

        if(!currency1_details){
            return (
                res.json({
                    message: "Currency1 with this currency id not exists in currency table",
                    status:false,
                })
            )
        }
        if(!currency2_details){
            return (
                res.json({
                    message: "Currency2 with this currency id not exists in currency table",
                    status:false,
                })
            )
        }

        let rir= req.body.rir;

        trade_type= trade_type.toLowerCase();
        rir=rir.toLowerCase();
        addedBy= addedBy.toLowerCase();

        var addedBy_id = req.body.addedBy_id;

        if(addedBy === "admin" && addedBy_id !=0){
            return(
                res.json({
                    message: "If added by is admin then addedBy_id must be 0"
                })
            )
        }
        if(addedBy === "admin" && addedBy_id==0){
            addedBy_id = 0
        }
        
        if(addedBy==="trader"){
            const foundTrader = await userModel.findOne({_id:req.body.addedBy_id , user_type:"trader" })
            if(!foundTrader){
                return (
                    res.json({
                        message: "Not any User with this Id is registered as a trader . please provide correct trader id",
                        status:false
                    })
                )
            }else{
                addedBy_id=req.body.addedBy_id
            }
           
        }

        if(!currency1_id || !currency2_id){
            return(
                res.json({
                    message: "currency1_id and currency2_id must be the provided",
                    status:false,
                })
            )
        }

        const newTrade =  new tradeModel({
            _id:mongoose.Types.ObjectId(),
            addedBy:addedBy,
            addedBy_id:addedBy_id,
            trade_type:trade_type,
            currency1_id:currency1_id,
            currency2_id:currency2_id,
            buy_price:buy_price,
            current_price:current_price,
            pips:pips,
            rir:rir,
            takeProfit:[],
            stopLoss:[],
            date_of_trade:date

        })

       
        console.log(currency1_details)

        const result = await newTrade.save();

       
        if(result){

            //sending notification fcm
            let isSend = sendNotification("New Trade added by admin");
            if(isSend){
                console.log('notification send')
                notificationDetail.notificationSendStatus= true;
            }
            else{notificationDetail.notificationSendStatus= false;}

            //storing notification
            let isStored = await createNotification(addedBy);
            if(isStored){notificationDetail.notificationStoringStatus= true} else {notificationDetail.notificationStoringStatus= false}


            result.currency1_id=currency1_details;
            result.currency2_id=currency2_details;
            res.json({
                message: "New Trade has been Created",
                result: result,
                status:true,
                notificationDetail:notificationDetail
            })

        }
        else{
            res.json({
                message: "Could not create Trade",
                status:false,
            })
        }
        
    
    }
    catch(err){
        res.json({
            message: "Error Occurred while creating trade",
            status:false,
            error:err.message
        })
    }
}

exports.getAllTrades = async (req,res)=>{
    try{
        const result = await tradeModel.aggregate([
            {
                
                    $lookup:{
                        from: "stop_losses",
                        localField:'_id',
                        foreignField:'trade_id',
                        as : "stop_losses"
                    }
                
            },
            
            {
                
                $lookup:{
                    from: "take_profits",
                    localField:'_id',
                    foreignField:'trade_id',
                    as : "take_profits"
                }
            
        },

        ]);

        if(result){
            res.json({
                message: "All Trades has fetched",
                result: result,
                status:true,
            })
        }
        else{
            res.json({
                message: "Could not fetch trades",
                status:false,
            })
        }

        
    }
    catch(err){
        res.json({
            message: "Error Occurred",
            error:err.message,
            status:false

        })
    }
}

exports.getTradeById = async (req,res)=>{
    try{
        let  trade_id = req.query.trade_id;
        trade_id= new ObjectId(trade_id);

        const result = await tradeModel.aggregate([

            {
                $match:{
                    _id:trade_id
                }
            },
            {
                
                $lookup:{
                    from: "stop_losses",
                    localField:'_id',
                    foreignField:'trade_id',
                    as : "stop_losses"
                }
            
        },
        {
            
            $lookup:{
                from: "take_profits",
                localField:'_id',
                foreignField:'trade_id',
                as : "take_profits"
            }
        
    }
        ]);

        if(result){
            res.json({
                message: "Trade with this id has fetched",
                result: result,
                status:true,
            })
        }
        else{
            res.json({
                message: "Could not fetch trade",
                status:false,
            })
        }

        
    }
    catch(err){
        res.json({
            message: "Error Occurred",
            error:err.message,
            status:false

        })
    }
}

exports.getAllTradersByTraderId = async (req,res)=>{
    try{
        let  trader_id = req.query.trader_id;
        
        console.log(trader_id);
        const result = await tradeModel.aggregate([

            {
                $match:{
                    addedBy_id:trader_id
                }
            },
            {
                
                $lookup:{
                    from: "stop_losses",
                    localField:'_id',
                    foreignField:'trade_id',
                    as : "stop_losses"
                }
            
        },
        {
            
            $lookup:{
                from: "take_profits",
                localField:'_id',
                foreignField:'trade_id',
                as : "take_profits"
            }
        
    }
        ]);

        if(result){
            res.json({
                message: "Trade with this id has fetched",
                result: result,
                status:true,
            })
        }
        else{
            res.json({
                message: "Could not fetch trade",
                status:false,
            })
        }

        
    }
    catch(err){
        res.json({
            message: "Error Occurred",
            error:err.message,
            status:false

        })
    }
}


exports.getAllTradesByAdmin = async (req,res)=>{
    try{
        const result = await tradeModel.aggregate([

            {
                $match:{
                    addedBy:"admin",
                }
            },
            {
                
                $lookup:{
                    from: "stop_losses",
                    localField:'_id',
                    foreignField:'trade_id',
                    as : "stop_losses"
                }
            
        },
        {
            
            $lookup:{
                from: "take_profits",
                localField:'_id',
                foreignField:'trade_id',
                as : "take_profits"
            }
        
    }
           
        ]);

        if(result){
            res.json({
                message: "All trades of admin has fetched successfully",
                result: result,
                status:true,
            })
        }
        else{
            res.json({
                message: "Could not fetch admin trades",
                status:false,
            })
        }

        
    }
    catch(err){
        res.json({
            message: "Error Occurred",
            error:err.message,
            status:false

        })
    }
}

exports.getAllTradesByTrader = async (req,res)=>{
    try{
        const result = await tradeModel.aggregate([

            {
                $match:{
                    addedBy:"trader",
                }
            },
            {
                $lookup:{
                    from : "users",
                    localField:"addedBy_id",
                    foreignField:'_id',
                    as:"traderDetails"
                }
            },
            {
                
                $lookup:{
                    from: "stop_losses",
                    localField:'_id',
                    foreignField:'trade_id',
                    as : "stop_losses"
                }
            
        },
        {
            
            $lookup:{
                from: "take_profits",
                localField:'_id',
                foreignField:'trade_id',
                as : "take_profits"
            }
        
    }
        ]);

        if(result){
            res.json({
                message: "Trades created by trader fetched",
                result: result,
                status:true,
            })
        }
        else{
            res.json({
                message: "Could not fetch trades",
                status:false,
            })
        }

        
    }
    catch(err){
        res.json({
            message: "Error Occurred",
            error:err.message,
            status:false

        })
    }
}

exports.deleteTradeById = async (req,res)=>{
    try{
        const trade_id = req.query.trade_id;

        const result = await tradeModel.deleteOne({_id:trade_id});
        if(result.deletedCount>0){
            res.json({
                message: "Trade with this id deleted",
                result: result,
                status:true
            })
        }else{
            res.json({
                message: "could not delete trade , Trade with this id may not exist",
                status:false
            })
        }
    }
    catch(err){
        res.json({
            message:"error",
            error:err.message,
            status:false
        })
    }
}

exports.deleteAllTradesOfAdmin = async (req,res)=>{
    try{
        const result = await tradeModel.deleteMany({addedBy:"admin"});
        console.log(result);
        if(result.deletedCount>0){
            res.json({
                message: result.deletedCount + " trades by admin deleted successfully",
                status:true,
                result: result
            })
        }
        else{
            res.json({
                message: "No any trade of admin deleted",
                status:true,
            })
        }
    }
    catch(err){
        res.json({
            message:"error",
            error:err.message,
            status:false
        })
    }
}

exports.deleteAllTradesOfTraders = async (req,res)=>{
    try{
        const result = await tradeModel.deleteMany({addedBy:"trader"});
        console.log(result);
        if(result.deletedCount>0){
            res.json({
                message: result.deletedCount + " trades by trader deleted successfully",
                status:true,
                result: result
            })
        }
        else{
            res.json({
                message: "No any trade of trader deleted",
                status:true,
            })
        }
    }
    catch(err){
        res.json({
            message:"error",
            error:err.message,
            status:false
        })
    }
}



// exports.updateTrade = async (req,res)=>{
//     try{
//         const 
//     }
// }

exports.active_close_trade = async (req,res)=>{
    try{
        let trade_status =  req.query.trade_status;
        trade_status  = trade_status.toLowerCase();
        const trade_id = req.query.trade_id;

        let tradeAddedBy ;

        var notificationDetail ={

        }

        if(!trade_id){
            return (
                res.json({
                    message: 'trade_id must be provided'
                })
            )
        }

        let trade = await tradeModel.findOne({_id:trade_id});
        if(trade){
            tradeAddedBy= trade.addedBy;
        }



        if(trade_status =="active" || trade_status ==="closed"){
            const result = await tradeModel.findOneAndUpdate({_id:trade_id } , {trade_status: trade_status} , {new:true});

        if(result){

            let isSend = sendNotification("Trade status Updated");
            if(isSend){
            console.log('notification send')
            notificationDetail.notificationOfUpdatingTradeSent= true;
            }
            else{notificationDetail.notificationOfUpdatingTradeSent= false;}
            //storing notification
            let isStored = await createNotification(tradeAddedBy);
            if(isStored){notificationDetail.NotificationOfUpdateStored= true} else {notificationDetail.NotificationOfUpdateStored= false}

            res.json({
                message: "Trade status has been updated successfully",
                result: result,
                status:true,
                notificationDetail:notificationDetail
            })
        }
        else{
            res.json({
                message: "Could not update . trade with this id may not exist",
                status:false,
            })
        }
        } 
        else{
            res.json({
                message: "trade_status must ne one of these = [active , closed]"
            })
        }  
    }
    catch(err){
        res.json({
            message: "Error Occurred",
            status:false,
            error:err.message
        })
    }
}

exports.deleteTradesOfSpecificTrader = async(req,res)=>{
    try{
        const trader_id = req.query.trader_id;
        const result = await tradeModel.deleteMany({addedBy_id:trader_id});

        if(result.deletedCount>0){
            res.json({
                message: "total of "+ result.deletedCount+" trades of trader deleted",
                status:true,
                result:result
            })
        }
        else{
            res.json({
                message: "Could not deleted",
                status:false,
            })
        }
    }
    catch(err){
        res.json({
            message: "Error",
            status:false,
            error:err.message
        })
    }
}

exports.updateTakeProfit = async (req,res)=>{
    try{
        const takeProfit = req.body.takeProfit;
        const trade_id = req.body.trade_id;

        var notificationDetail ={

        }

        if(!trade_id){
            return(
                res.json({
                    message: "trade_id is required",
                    status:false,
                })
            )
            
        }


        let trade = await tradeModel.findOne({_id:trade_id});
        if(trade){
            tradeAddedBy= trade.addedBy;
        }

        console.log(Array.isArray(takeProfit))

        if(Array.isArray(takeProfit)==false){
            return(
                res.json({
                    message: "take profit must be an array",
                    status:false,
                })
            )
            
        }
        
        let regex = /[T][P]\d+$/g
        
        
        if(takeProfit){
            for(let i=0 ; i<takeProfit.length ; i++){
                if(takeProfit[i].take_profit_name){
                    let isMatch = takeProfit[i].take_profit_name.match(regex)
                    if(!isMatch){
                        return(
                            res.json({
                                message: "take profit name must be in the format  Name must be like : TP1 ,TP2 , It seems One of element of array not following the format",
                                status:false,
                            })
                        )
                    }


                }
                else{
                    res.json({
                        message: "It seems some array Object ,may not have take_profit_name , please provide take profit_name in every takeProfit object ",
                        status:false
                    })
                }
            }
        }

        const result = await tradeModel.findOneAndUpdate({_id:trade_id} 
            ,
            {
                takeProfit: takeProfit
            },
            {
                new:true
            }
            );

            
        if(result){

            let isSend = sendNotification("Take Profit of trade updated");
            if(isSend){
            console.log('notification send')
            notificationDetail.takeProfitUpdatedNotificationSend= true;
            }
            else{notificationDetail.takeProfitUpdatedNotificationSend= false;}
            //storing notification
            let isStored = await createNotification(tradeAddedBy);
            if(isStored){notificationDetail.takeProfitNotificationStore= true} else {notificationDetail.takeProfitNotificationStore= false}


            res.json({
                message: "Take Profit has been successfully updated",
                result: result,
                status:true,
                notificationDetail:notificationDetail
            })
        }
        else{
            res.json({
                message: "could not update take profit",
                status:false,
            })
        }      

        
    }
    catch(err){
        res.json({
            message: "Error Occurred",
            status:false,
            error:err.message
        })
    }
}


exports.updateStopLoss = async (req,res)=>{
    try{
        const stopLoss = req.body.stopLoss;
        const trade_id = req.body.trade_id;

        var notificationDetail ={

        }


        if(!trade_id){
            return(
                res.json({
                    message: "trade_id is required",
                    status:false,
                })
            )
            
        }
        let trade = await tradeModel.findOne({_id:trade_id});
        if(trade){
            tradeAddedBy= trade.addedBy;
        }



        console.log(Array.isArray(stopLoss))

        if(Array.isArray(stopLoss)==false){
            return(
                res.json({
                    message: "stop loss must be an array",
                    status:false,
                })
            )
            
        }
        
        let regex = /[S][L]\d+$/g

        
        
        if(stopLoss){
            for(let i=0 ; i<stopLoss.length ; i++){
                if(stopLoss[i].stop_loss_name){
                    let isMatch = stopLoss[i].stop_loss_name.match(regex)
                    if(!isMatch){
                        return(
                            res.json({
                                message: "stop loss name must be in the format  Name must be like : SL1 ,SL2 , It seems One of element of array not following the format",
                                status:false,
                            })
                        )
                    }


                }
                else{
                    res.json({
                        message: "It seems some array Object ,may not have stop_loss_name, please provide stop_loss_name in every stopLoss object ",
                        status:false
                    })
                }
            }
        }

        const result = await tradeModel.findOneAndUpdate({_id:trade_id} 
            ,
            {
                stopLoss: stopLoss
            },
            {
                new:true
            }
            );

            
        if(result){

            let isSend = sendNotification("Stop Loss of Trade Updated");
            if(isSend){
            console.log('notification send')
            notificationDetail.StopLossUpdatedNotificationSend= true;
            }
            else{notificationDetail.StopLossUpdatedNotificationSend= false;}
            //storing notification
            let isStored = await createNotification(tradeAddedBy);
            if(isStored){notificationDetail.stopLossNotificationStore= true} else {notificationDetail.stopLossNotificationStore= false}



            res.json({
                message: "stopLoss has been successfully updated",
                result: result,
                status:true,
                notificationDetail:notificationDetail
            })
        }
        else{
            res.json({
                message: "could not update stopLoss",
                status:false,
            })
        }      

        
    }
    catch(err){
        res.json({
            message: "Error Occurred",
            status:false,
            error:err.message
        })
    }
}


exports.getAllTradesForAdminPanel = async (req,res)=>{
    try{
        const result = await tradeModel.aggregate([
            {
                
                    $lookup:{
                        from: "stop_losses",
                        localField:'_id',
                        foreignField:'trade_id',
                        as : "stop_losses"
                    }
                
            },
            
            {
                
                $lookup:{
                    from: "take_profits",
                    localField:'_id',
                    foreignField:'trade_id',
                    as : "take_profits"
                }
            
        },
        {
            $lookup:{
                from:'currencies',
                localField:'currency1_id',
                foreignField:'_id',
                as : "currency1_id"
            }
        },
        {
            $set: {
                currency1_id: { $arrayElemAt: ["$currency1_id", 0] }
            }
          },
        {
            $lookup:{
                from:'currencies',
                localField:'currency2_id',
                foreignField:'_id',
                as : "currency2_id"
            }
        },
        {
            $set: {
                currency2_id: { $arrayElemAt: ["$currency2_id", 0] }
            }
          }
        ]);

        if(result){
            res.json({
                message: "All Trades has fetched",
                result: result,
                status:true,
            })
        }
        else{
            res.json({
                message: "Could not fetch trades",
                status:false,
            })
        }

        
    }
    catch(err){
        res.json({
            message: "Error Occurred",
            error:err.message,
            status:false

        })
    }
}



async function createNotification(added_by){
    try{
        const newNotification = new notificationModel({
            _id : mongoose.Types.ObjectId(),
            from:added_by,
            to:'all',
            message:"New Trade has been added",
            notification_type:'new_trade'
        });

        const result = await newNotification.save();

        if(result){
            return true
        }
        else{
            return false
        }
    }
    catch(err){
        console.log(err);
        return false;
    }
}

