const Invoice = require("../models/invoice.model");
const Client = require("../models/client.model");
const Payment = require("../models/payment.model");
const Policy = require("../models/policy.model");

const moment = require("moment");

async function getInvoices(req, res, next) {
  try {
    const invoices = await Invoice.findAll();
    res.render("agents/invoice/all-invoices", { invoices: invoices });
  } catch (error) {
    next(error);
    return;
  }
}

async function viewInvoice(req, res, next) {
const invoice = await Invoice.findById(req.params.id);
const invoiceData = {
  clientName: invoice.clinetName,
  clientAddress: invoice.clinetAddress,
  clientPin: invoice.clinetPin,
  policyNumber: invoice.policyNumber,
  policyAmount: invoice.policyAmount,
  policyDate: invoice.policyDate, 
  invoicesNumber: invoice.invoicesNumber
}
  res.render("agents/clients/single-invoice", {invoiceData: invoiceData, invoiceNumber:invoiceData.invoicesNumber});
}

async function findInvoice(req, res, next) {

  const client = await Client.findByPin(req.body.clientPin);
  const theClientPage = '/invoice/' + client._id.toHexString()
  res.redirect(theClientPage);
}

async function insertInvoice(req, res, next) {

  const invoice = new Invoice();
  try {
    await invoice.save();
  } catch (error) {
    next(error);
    return;
  }

  //finding the url for the concrete client that has made the payment (to transfer to his/her page)
  const clientThroughPayment = await Invoice.findByPin(invoicePin.toString());
  const objectId = clientThroughPayment._id;
  const theClientPage = '/agents/clients/' + objectId

  res.redirect(theClientPage);
}

async function getInvoice(req, res, next) {

  const policy = await Policy.findById(req.body.policyId);
  const client = await Client.findById(req.body.clientId);

const allInvoicesFound = await Invoice.findAll()

  let invoicesNumber = allInvoicesFound.length + 1

  const invoiceData = {
    clientName: client.name,
    clientAddress: client.address,
    clientPin: client.pin,
    policyNumber: policy.policyNumber,
    policyType: policy.policyType, 
    policyAmount: policy.policyAmount,
    policyDate: policy.policyDate, 
    invoicesNumber: invoicesNumber
  }

  const theInvoice = await Invoice.findByPolicy(policy.policyNumber);

  if (theInvoice)  {
    const invoiceNumber = theInvoice.invoicesNumber;
    res.render("agents/clients/single-invoice", {invoiceData: invoiceData, invoiceNumber:invoiceNumber });
    return
  }
  if (!theInvoice) {
  const invoice = new Invoice(invoiceData);
  try {
    await invoice.save(invoiceData);
  } catch (error) {
    next(error);
    return;
  }    
  const invoiceNumber = allInvoicesFound.length + 1

    res.render("agents/clients/single-invoice", {invoiceData: invoiceData, invoiceNumber:invoiceNumber});
}
}
  
module.exports = {
  findInvoice:findInvoice,
  insertInvoice:insertInvoice,
  getInvoices:getInvoices,
  getInvoice: getInvoice,
  viewInvoice:viewInvoice
};
