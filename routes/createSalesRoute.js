
const express = require('express');
const router = express.Router();
const controller = require("../controllers/createSalesController")

router.post("/createSales" , controller.createSale)
router.put("/createPayout" , controller.createPayout)
router.get("/getUserTotalSales" , controller.getUserTotalSales)
router.get("/getUserTotalSalesByPayoutStatus" , controller.getUserTotalSalesByPayoutStatus)
router.get("/getUserTotalSalesByMonth" , controller.getUserSalesByMonth)
router.get("/getUserTotalSalesByYear" , controller.getUserSalesByYear)
router.get("/getAllSales" , controller.getAllSales)
router.get("/getAllSalesByMonthAndYear" , controller.getAllSalesByMonthAndYear)
router.get("/getAllSalesByYear" , controller.getAllSalesByYear)







module.exports= router;