const fs = require('fs')
const Handlebars = require('handlebars')
const path = require('path')
const puppeteer = require('puppeteer')
const { error } = require('console')

const Busines = require('../models/business.model')
const User = require('../models/user.model')

Handlebars.registerHelper('eq', function (arg1, arg2) {
    return arg1 === arg2;
  });

const generateInvoice = async (socket, savedTransaction) => {
    const {_id,items,transDate,executor,totalCostPrice,generalDiscount,payedAmount,change,paymentMethod} = savedTransaction
    const {names} = await User.findById(executor)
    const [business] = await Busines.find({})
    const {businessName} = business

   const itemList = items.map(item => ({
   ...item._doc, // Extract the actual data
   itemId: item._doc.itemId.toString(), // Convert ObjectId to string
  _id: item._doc._id.toString()       // Convert _id to string
}));

console.log(itemList)

    const data = {
        businessName,
        transactionId: _id,
        userName: names,
        transDate:transDate,
        items:itemList,
        generalDiscount:generalDiscount,
        payedAmount:payedAmount,
        grandTotal:totalCostPrice,
        change:change, 
        curr:'UGX '
    }

    const templatePath = path.join(__dirname, './docs/invoice.html');
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    
    // Compile the template
    const template = Handlebars.compile(templateSource, {
        allowProtoPropertiesByDefault: true,
    });
    
    // Inject the data
    const renderedHtml = template(data);
    
    pdfGen(socket, renderedHtml)
}

const pdfGen = async (socket, renderedHtml) => {
    try{
        const browser = await puppeteer.launch()
        const page = await browser.newPage()

        await page.setContent(renderedHtml);
        const invoicename = await randomInvoiceNameGenerator()
    
        const pdfPath = path.join(__dirname,`../public/documents/${invoicename}`)
    
        await page.pdf({
            path: pdfPath,  // Path to save the generated PDF
            format: 'A4',   // Paper size
            printBackground: true  // Include background in the PDF
          });
      
          await browser.close();

          pdfGenHandler(socket, `public/documents/${invoicename}`)
    }catch(err) {
        console.log(`PDF GENERATION FAILED ${err}`)
    }
}

const randomInvoiceNameGenerator = async () => {
    try {
        const date = Date.now()
        const filename = `invoice-${date}.pdf`
        return filename
    }catch(err) {
        console.log(error)
    }
   
}

const pdfGenHandler = async (socket,pdfPath) => {
       socket.emit('pdf-invoice',pdfPath)
}

module.exports = {
    generateInvoice
}

