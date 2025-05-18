const sgMail = require('@sendgrid/mail')
const { Buffer } = require('buffer')
const path = require('path')
const fsPromises = require('fs').promises
require('dotenv').config()
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendOutMail = async (newUser) => {
    try {
        // const filePath = await fsPromises.readFile(path.join(__dirname, '..', 'public', 'admin-005', 'customerPreferredProfilePhoto2.jpg'))
        // let buffer = Buffer.from(filePath, "utf-8").toString("base64")

        let attachment = []
        // let attachment_draft = {
        //     content: buffer,
        //     filename: "user_photo.jpeg",
        //     type: "image/jpeg",
        //     disposition: "attachment"
        // }

        // attachment.push(attachment_draft)

        const msg = {
            to: [
                {
                    // email: "ezeabasili@yahoo.co.uk",
                    email: newUser.email,
                    name: newUser.name
                }
            ],
            from: {
                email: "support.team@meridian-hosts.com", // Change to your verified sender
                name: "Support Team"
            },
            templateId: "d-37675714af03488e8c82132c09524b82",
            dynamicTemplateData: {
                name: newUser.name
            }
        }

        if (attachment.length > 0) {
            msg.attachments = attachment
        }

        await sgMail.send(msg)
        console.log('email has been sent by Eze of Brazil')

    } catch (err) {
        console.log(err)
    }

}

module.exports = sendOutMail