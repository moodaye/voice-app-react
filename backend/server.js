import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

const accountData = {
  checking: 2540.34,
  savings: 10420.76,
}

const buildResponse = (query) => {
  const normalized = query.toLowerCase()

  if (normalized.includes('checking') && normalized.includes('balance')) {
    return `Your checking account balance is $${accountData.checking.toFixed(2)}.`
  }

  if (normalized.includes('savings') && normalized.includes('balance')) {
    return `Your savings account balance is $${accountData.savings.toFixed(2)}.`
  }

  if (normalized.includes('account') && normalized.includes('balance')) {
    return `Your checking account balance is $${accountData.checking.toFixed(2)} and your savings account balance is $${accountData.savings.toFixed(2)}.`
  }

  return 'I can help with account balance questions. Try asking: what is my checking account balance?'
}

app.post('/api/voice-command', (req, res) => {
  const query = typeof req.body?.query === 'string' ? req.body.query.trim() : ''

  if (!query) {
    res.status(400).json({ reply: 'I did not receive a valid query.' })
    return
  }

  const reply = buildResponse(query)
  res.json({ reply })
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Voice backend running on http://localhost:${PORT}`)
})
