const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const requireTenant = require('../middlewares/requireTenant')

// Configura o storage do multer para a pasta backend/uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads')
    // Cria a pasta se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // Para segurança, evitar nomes de arquivos que possam tentar sobrescrever coisas
    const ext = path.extname(file.originalname)
    const fileName = `${req.tenantId}_${Date.now()}${ext}`
    cb(null, fileName)
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limite de segurança
})

// Rota protegida: Upload de imagem
router.post('/', requireTenant, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' })
  }

  // Gera a URL pública para acessar o arquivo.
  // Como o server do express está servindo a pasta uploads em /uploads estaticamente
  // A porta padrão estamos assumindo 3000 (ou configurável via env)
  const host = req.get('host') // ex: localhost:3000
  const protocol = req.protocol // ex: http
  const publicUrl = `${protocol}://${host}/uploads/${req.file.filename}`

  res.json({ publicUrl })
})

// Rota protegida: Deletar imagem antiga
router.delete('/:filename', requireTenant, (req, res) => {
  const { filename } = req.params

  // Validação básica de segurança (evitar diretórios fora do escopo como ../)
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    return res.status(400).json({ error: 'Nome de arquivo inválido' })
  }

  // Apenas deixa deletar se o arquivo pertencer ao tenant logado (nomenclatura tenantId_Date.ext)
  if (!filename.startsWith(req.tenantId + '_')) {
    return res.status(403).json({ error: 'Você não tem permissão para deletar este arquivo' })
  }

  const filePath = path.join(__dirname, '../../uploads', filename)

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    res.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error)
    res.status(500).json({ error: 'Erro ao deletar arquivo' })
  }
})

module.exports = router
