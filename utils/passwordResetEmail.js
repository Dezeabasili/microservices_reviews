const sgMail = require('@sendgrid/mail')
const { Buffer } = require('buffer')
const path = require('path')
const fsPromises = require('fs').promises
require('dotenv').config()
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const passwordResetMail = async (person, passwordReset) => {
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
                    email: person.email,
                    name: person.name
                }
            ],
            from: {
                email: "support.team@meridian-hosts.com", // Change to your verified sender
                name: "Support Team"
            },
            templateId: "d-6f2b6e3466d5428db9ae90d9183e5808",
            dynamicTemplateData: {
                password: passwordReset
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

module.exports = passwordResetMail