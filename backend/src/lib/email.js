const nodemailer = require('nodemailer')

// Configuração para uso do Ethereal (para desenvolvimento/testes locais)
// Em produção, isso seria trocado por Resend, SendGrid ou AWS SES.
let transporter

const initTransporter = async () => {
  if (!transporter) {
    if (process.env.NODE_ENV === 'production') {
      // Configuração fake de prod, ou real com variáveis env
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    } else {
      // Mock com Ethereal Email para testes em dev
      const testAccount = await nodemailer.createTestAccount()
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      })
      console.log('Ethereal Email configurado para dev. Verifique logs para visualizar mensagens.')
    }
  }
  return transporter
}

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const mailer = await initTransporter()
    const info = await mailer.sendMail({
      from: '"Cardápio Online SaaS" <noreply@cardapio.online>',
      to,
      subject,
      text,
      html
    })

    console.log(`E-mail enviado: ${info.messageId}`)
    
    // Mostra URL no log se for Ethereal (Dev)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`)
    }

    return info
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error)
    throw new Error('Falha no envio de e-mail')
  }
}

module.exports = {
  sendEmail
}
